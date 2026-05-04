import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'

// Create the mock function first
const mockTwilioDefault = jest.fn()

// Mock the twilio module before importing SmsService
jest.mock('twilio', () => {
  return {
    __esModule: true,
    default: mockTwilioDefault,
  }
})

// Now import SmsService after the mock is set up
import { SmsService } from './sms.service'

describe('SmsService', () => {
  let service: SmsService
  let configService: ConfigService
  let mockTwilioClient: any
  let loggerLogSpy: jest.SpyInstance
  let loggerWarnSpy: jest.SpyInstance

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  }

  beforeEach(async () => {
    // Clear mock calls from previous tests
    mockTwilioDefault.mockClear()
    
    // Spy on Logger.prototype.log before creating the service
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log')
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn')

    // Create mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'SM123456789' }),
      },
    }

    // Mock the twilio.default function to return our mock client
    mockTwilioDefault.mockImplementation(() => mockTwilioClient)

    // Default mock implementation for ConfigService
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        TWILIO_ACCOUNT_SID: 'AC1234567890abcdef1234567890abcd',
        TWILIO_AUTH_TOKEN: 'auth_token_12345',
        TWILIO_PHONE_NUMBER: '+21612345678',
      }
      return config[key]
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<SmsService>(SmsService)
    configService = module.get<ConfigService>(ConfigService)
  })

  afterEach(() => {
    // Restore spies after each test
    loggerLogSpy?.mockRestore()
    loggerWarnSpy?.mockRestore()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should have ConfigService injected', () => {
    expect(configService).toBeDefined()
  })

  describe('Service Initialization', () => {
    it('should initialize Twilio client with valid credentials and log success', () => {
      // Validates: Requirements 1.1, 5.5
      // The service was already created in beforeEach with valid credentials
      
      // Verify that twilio.default was called with correct parameters
      expect(mockTwilioDefault).toHaveBeenCalledWith(
        'AC1234567890abcdef1234567890abcd',
        'auth_token_12345',
      )

      // Verify that the success log was emitted
      expect(loggerLogSpy).toHaveBeenCalledWith('Twilio SMS service initialized')
    })

    it('should not initialize Twilio client when ACCOUNT_SID does not start with "AC" and log warning', async () => {
      // Validates: Requirements 1.2
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock ConfigService to return invalid ACCOUNT_SID
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          TWILIO_ACCOUNT_SID: 'XX1234567890abcdef1234567890abcd',
          TWILIO_AUTH_TOKEN: 'auth_token_12345',
          TWILIO_PHONE_NUMBER: '+21612345678',
        }
        return config[key]
      })

      // Create a new service instance with invalid ACCOUNT_SID
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Verify that twilio.default was NOT called
      expect(mockTwilioDefault).not.toHaveBeenCalled()

      // Verify that a warning was logged
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio not configured or invalid credentials'),
      )

      // Verify the service is still defined (doesn't crash)
      expect(testService).toBeDefined()
    })

    it('should not initialize Twilio client when AUTH_TOKEN is invalid (≤10 characters) and log warning', async () => {
      // Validates: Requirements 1.3
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock ConfigService to return invalid AUTH_TOKEN (≤10 characters)
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          TWILIO_ACCOUNT_SID: 'AC1234567890abcdef1234567890abcd',
          TWILIO_AUTH_TOKEN: 'short',
          TWILIO_PHONE_NUMBER: '+21612345678',
        }
        return config[key]
      })

      // Create a new service instance with invalid AUTH_TOKEN
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Verify that twilio.default was NOT called
      expect(mockTwilioDefault).not.toHaveBeenCalled()

      // Verify that a warning was logged
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio not configured or invalid credentials'),
      )

      // Verify the service is still defined (doesn't crash)
      expect(testService).toBeDefined()
    })

    it('should not initialize Twilio client when PHONE_NUMBER is missing and log warning', async () => {
      // Validates: Requirements 1.4
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock ConfigService to return missing PHONE_NUMBER
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string | undefined> = {
          TWILIO_ACCOUNT_SID: 'AC1234567890abcdef1234567890abcd',
          TWILIO_AUTH_TOKEN: 'auth_token_12345',
          TWILIO_PHONE_NUMBER: undefined,
        }
        return config[key]
      })

      // Create a new service instance with missing PHONE_NUMBER
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Verify that twilio.default was NOT called
      expect(mockTwilioDefault).not.toHaveBeenCalled()

      // Verify that a warning was logged
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio not configured or invalid credentials'),
      )

      // Verify the service is still defined (doesn't crash)
      expect(testService).toBeDefined()
    })

    it('should not initialize Twilio client when all credentials are missing and log warning', async () => {
      // Validates: Requirements 1.5, 5.4
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock ConfigService to return all missing credentials
      mockConfigService.get.mockImplementation((key: string) => {
        return undefined
      })

      // Create a new service instance with all missing credentials
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Verify that twilio.default was NOT called
      expect(mockTwilioDefault).not.toHaveBeenCalled()

      // Verify that a warning was logged
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio not configured or invalid credentials'),
      )

      // Verify the service is still defined (doesn't crash)
      expect(testService).toBeDefined()
    })
  })

  describe('SMS Sending - Happy Path', () => {
    let loggerErrorSpy: jest.SpyInstance

    beforeEach(() => {
      // Spy on logger.error for error handling tests
      loggerErrorSpy = jest.spyOn(Logger.prototype, 'error')
    })

    afterEach(() => {
      loggerErrorSpy?.mockRestore()
    })

    it('should send SMS with valid parameters and call Twilio with correct body, from, and to', async () => {
      // Validates: Requirements 2.1
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()
      loggerLogSpy.mockClear()

      // Call sendRecommendationReminder with valid parameters
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Jean Dupont',
        activityTitle: 'Formation TypeScript',
        activityDate: new Date('2024-03-15'),
        deadlineDays: 5,
        frontendUrl: 'https://example.com',
      })

      // Verify that Twilio client.messages.create was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the call arguments
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]

      // Verify the 'to' parameter
      expect(callArgs.to).toBe('+33612345678')

      // Verify the 'from' parameter
      expect(callArgs.from).toBe('+21612345678')

      // Verify the 'body' parameter contains expected content
      expect(callArgs.body).toContain('Jean Dupont')
      expect(callArgs.body).toContain('Formation TypeScript')
      expect(callArgs.body).toContain('5 jours')
      expect(callArgs.body).toContain('https://example.com/employee/activities')

      // Verify that success log was emitted with SID
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS sent to +33612345678'),
      )
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SID: SM123456789'),
      )
    })

    it('should use default deadline of 3 days when deadlineDays is not provided', async () => {
      // Validates: Requirements 2.3
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder without deadlineDays parameter
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Marie Martin',
        activityTitle: 'Atelier Agile',
        activityDate: new Date('2024-04-20'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the SMS body
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      const smsBody = callArgs.body

      // Verify that the body contains "3 jours" (default deadline)
      expect(smsBody).toContain('3 jours')
    })

    it('should use custom deadline when deadlineDays is provided', async () => {
      // Validates: Requirements 2.4
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder with custom deadlineDays
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Pierre Durand',
        activityTitle: 'Séminaire Leadership',
        activityDate: new Date('2024-05-10'),
        deadlineDays: 7,
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the SMS body
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      const smsBody = callArgs.body

      // Verify that the body contains "7 jours" (custom deadline)
      expect(smsBody).toContain('7 jours')
    })

    it('should use default URL when frontendUrl is not provided', async () => {
      // Validates: Requirements 2.5
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Store original env value
      const originalFrontendUrl = process.env.FRONTEND_URL

      // Set environment variable for this test
      process.env.FRONTEND_URL = 'http://localhost:5173'

      // Call sendRecommendationReminder without frontendUrl parameter
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Sophie Bernard',
        activityTitle: 'Workshop Innovation',
        activityDate: new Date('2024-06-01'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the SMS body
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      const smsBody = callArgs.body

      // Verify that the body contains the default URL with path
      expect(smsBody).toContain('http://localhost:5173/employee/activities')

      // Restore original env value
      if (originalFrontendUrl !== undefined) {
        process.env.FRONTEND_URL = originalFrontendUrl
      } else {
        delete process.env.FRONTEND_URL
      }
    })

    it('should use custom URL when frontendUrl is provided', async () => {
      // Validates: Requirements 2.5
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder with custom frontendUrl
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Luc Petit',
        activityTitle: 'Conférence Tech',
        activityDate: new Date('2024-07-15'),
        frontendUrl: 'https://custom-domain.com',
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the SMS body
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      const smsBody = callArgs.body

      // Verify that the body contains the custom URL with path
      expect(smsBody).toContain('https://custom-domain.com/employee/activities')
    })
  })

  describe('Phone Number Normalization', () => {
    it('should normalize 8-digit Tunisian numbers to E.164 format (+216)', async () => {
      // Validates: Requirements 2.2, 3.1
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder with 8-digit Tunisian number
      await service.sendRecommendationReminder({
        to: '12345678',
        employeeName: 'Ahmed Ben Ali',
        activityTitle: 'Formation React',
        activityDate: new Date('2024-08-01'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the 'to' parameter
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]

      // Verify that the number was normalized to E.164 format
      expect(callArgs.to).toBe('+21612345678')
    })

    it('should keep numbers already in E.164 format unchanged', async () => {
      // Validates: Requirements 3.2
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder with E.164 formatted number
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'François Dubois',
        activityTitle: 'Atelier DevOps',
        activityDate: new Date('2024-09-10'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the 'to' parameter
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]

      // Verify that the number remained unchanged
      expect(callArgs.to).toBe('+33612345678')
    })

    it('should convert "00" prefix to "+" for international numbers', async () => {
      // Validates: Requirements 3.3
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder with "00" prefix
      await service.sendRecommendationReminder({
        to: '0033612345678',
        employeeName: 'Marie Leclerc',
        activityTitle: 'Séminaire Cloud',
        activityDate: new Date('2024-10-05'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the 'to' parameter
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]

      // Verify that "00" was converted to "+"
      expect(callArgs.to).toBe('+33612345678')
    })

    it('should remove formatting characters (spaces, hyphens, parentheses, dots) before normalization', async () => {
      // Validates: Requirements 3.4
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder with formatted number
      await service.sendRecommendationReminder({
        to: '(12) 34-56.78',
        employeeName: 'Salma Trabelsi',
        activityTitle: 'Workshop Scrum',
        activityDate: new Date('2024-11-20'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the 'to' parameter
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]

      // Verify that formatting was removed and number was normalized
      expect(callArgs.to).toBe('+21612345678')
    })

    it('should return null and skip SMS for invalid phone numbers (null, empty, invalid format)', async () => {
      // Validates: Requirements 3.5, 3.6
      // Clear previous mock calls and spies
      mockTwilioClient.messages.create.mockClear()
      loggerWarnSpy.mockClear()

      // Test with empty string
      await service.sendRecommendationReminder({
        to: '',
        employeeName: 'Test User',
        activityTitle: 'Test Activity',
        activityDate: new Date('2024-12-01'),
      })

      // Verify warning was logged for empty string
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS skipped — invalid phone number'),
      )

      // Verify Twilio was NOT called
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled()

      // Clear for next test
      mockTwilioClient.messages.create.mockClear()
      loggerWarnSpy.mockClear()

      // Test with invalid format (letters)
      await service.sendRecommendationReminder({
        to: 'abc123xyz',
        employeeName: 'Test User 2',
        activityTitle: 'Test Activity 2',
        activityDate: new Date('2024-12-02'),
      })

      // Verify warning was logged for invalid format
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS skipped — invalid phone number'),
      )

      // Verify Twilio was NOT called
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled()

      // Clear for next test
      mockTwilioClient.messages.create.mockClear()
      loggerWarnSpy.mockClear()

      // Test with too few digits
      await service.sendRecommendationReminder({
        to: '123',
        employeeName: 'Test User 3',
        activityTitle: 'Test Activity 3',
        activityDate: new Date('2024-12-03'),
      })

      // Verify warning was logged for too few digits
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS skipped — invalid phone number'),
      )

      // Verify Twilio was NOT called
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    let loggerErrorSpy: jest.SpyInstance

    beforeEach(() => {
      // Spy on logger.error for error handling tests
      loggerErrorSpy = jest.spyOn(Logger.prototype, 'error')
    })

    afterEach(() => {
      loggerErrorSpy?.mockRestore()
    })

    it('should log error and not throw when Twilio client.messages.create throws an error', async () => {
      // Validates: Requirements 4.1, 4.2
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()
      loggerErrorSpy.mockClear()

      // Mock Twilio to throw an error
      const twilioError = new Error('Twilio API error: Invalid phone number')
      mockTwilioClient.messages.create.mockRejectedValueOnce(twilioError)

      // Call sendRecommendationReminder - should not throw
      await expect(
        service.sendRecommendationReminder({
          to: '+33612345678',
          employeeName: 'Test User',
          activityTitle: 'Test Activity',
          activityDate: new Date('2024-12-15'),
        }),
      ).resolves.not.toThrow()

      // Verify that Twilio was called (attempt was made)
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Verify that error was logged
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS failed to +33612345678'),
      )
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio API error: Invalid phone number'),
      )
    })

    it('should log warning and not call Twilio when phone number is invalid', async () => {
      // Validates: Requirements 4.3, 4.4
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()
      loggerWarnSpy.mockClear()

      // Call sendRecommendationReminder with invalid phone number
      await service.sendRecommendationReminder({
        to: 'invalid-phone',
        employeeName: 'Test User',
        activityTitle: 'Test Activity',
        activityDate: new Date('2024-12-15'),
      })

      // Verify that warning was logged
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS skipped — invalid phone number: "invalid-phone"'),
      )

      // Verify that Twilio was NOT called
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled()
    })

    it('should return immediately and not call Twilio when client is null', async () => {
      // Validates: Requirements 2.6
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock ConfigService to return missing credentials (client will be null)
      mockConfigService.get.mockImplementation((key: string) => {
        return undefined
      })

      // Create a new service instance with null client
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Clear mock calls after service creation
      mockTwilioClient.messages.create.mockClear()

      // Call sendRecommendationReminder
      await testService.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Test User',
        activityTitle: 'Test Activity',
        activityDate: new Date('2024-12-15'),
      })

      // Verify that Twilio was NOT called (client is null)
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled()
    })

    it('should log warning and remain functional when Twilio initialization fails', async () => {
      // Validates: Requirements 4.5
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock twilio.default to throw an error during initialization
      const initError = new Error('Twilio initialization failed')
      mockTwilioDefault.mockImplementationOnce(() => {
        throw initError
      })

      // Mock ConfigService to return valid credentials
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          TWILIO_ACCOUNT_SID: 'AC1234567890abcdef1234567890abcd',
          TWILIO_AUTH_TOKEN: 'auth_token_12345',
          TWILIO_PHONE_NUMBER: '+21612345678',
        }
        return config[key]
      })

      // Create a new service instance - should not throw
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Verify that a warning was logged about init failure
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio init failed — SMS disabled'),
      )
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio initialization failed'),
      )

      // Verify the service is still defined (didn't crash)
      expect(testService).toBeDefined()
    })

    it('should handle error without message property during initialization', async () => {
      // Validates: Requirements 4.5 - Branch coverage for err?.message ?? err
      // Clear previous calls
      mockTwilioDefault.mockClear()
      loggerWarnSpy.mockClear()

      // Mock twilio.default to throw an error without message property
      const initError = 'String error without message property'
      mockTwilioDefault.mockImplementationOnce(() => {
        throw initError
      })

      // Mock ConfigService to return valid credentials
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          TWILIO_ACCOUNT_SID: 'AC1234567890abcdef1234567890abcd',
          TWILIO_AUTH_TOKEN: 'auth_token_12345',
          TWILIO_PHONE_NUMBER: '+21612345678',
        }
        return config[key]
      })

      // Create a new service instance - should not throw
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile()

      const testService = module.get<SmsService>(SmsService)

      // Verify that a warning was logged with the string error
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Twilio init failed — SMS disabled'),
      )
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('String error without message property'),
      )

      // Verify the service is still defined (didn't crash)
      expect(testService).toBeDefined()
    })

    it('should handle error without message property when sending SMS fails', async () => {
      // Validates: Requirements 4.1, 4.2 - Branch coverage for err?.message ?? err
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()
      loggerErrorSpy.mockClear()

      // Mock Twilio to throw a string error (no message property)
      const twilioError = 'String error without message property'
      mockTwilioClient.messages.create.mockRejectedValueOnce(twilioError)

      // Call sendRecommendationReminder - should not throw
      await expect(
        service.sendRecommendationReminder({
          to: '+33612345678',
          employeeName: 'Test User',
          activityTitle: 'Test Activity',
          activityDate: new Date('2024-12-15'),
        }),
      ).resolves.not.toThrow()

      // Verify that Twilio was called (attempt was made)
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Verify that error was logged with the string error
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS failed to +33612345678'),
      )
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('String error without message property'),
      )
    })
  })

  describe('Message Formatting', () => {
    beforeEach(() => {
      // Clear previous mock calls
      mockTwilioClient.messages.create.mockClear()
    })

    it('should include employee name in SMS body', async () => {
      // Validates: Requirements 6.1
      const employeeName = 'Jean Dupont'

      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: employeeName,
        activityTitle: 'Formation TypeScript',
        activityDate: new Date('2024-03-15'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the SMS body
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      const smsBody = callArgs.body

      // Verify that the body contains the employee name
      expect(smsBody).toContain(employeeName)
    })

    it('should include activity title in SMS body', async () => {
      // Validates: Requirements 6.2
      const activityTitle = 'Atelier Agile Scrum'

      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Marie Martin',
        activityTitle: activityTitle,
        activityDate: new Date('2024-04-20'),
      })

      // Verify that Twilio was called
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1)

      // Extract the SMS body
      const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      const smsBody = callArgs.body

      // Verify that the body contains the activity title
      expect(smsBody).toContain(activityTitle)
    })

    it('should format activity date in French locale (dd month yyyy)', async () => {
      // Validates: Requirements 6.3
      // Test with multiple dates to ensure consistent formatting
      const testCases = [
        { date: new Date('2024-03-15'), expected: '15 mars 2024' },
        { date: new Date('2024-12-25'), expected: '25 décembre 2024' },
        { date: new Date('2024-01-01'), expected: '01 janvier 2024' },
      ]

      for (const testCase of testCases) {
        mockTwilioClient.messages.create.mockClear()

        await service.sendRecommendationReminder({
          to: '+33612345678',
          employeeName: 'Pierre Durand',
          activityTitle: 'Séminaire Leadership',
          activityDate: testCase.date,
        })

        // Extract the SMS body
        const callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
        const smsBody = callArgs.body

        // Verify that the body contains the formatted date
        expect(smsBody).toContain(testCase.expected)
      }
    })

    it('should include deadline in days in SMS body', async () => {
      // Validates: Requirements 6.4
      // Test with default deadline
      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Sophie Bernard',
        activityTitle: 'Workshop Innovation',
        activityDate: new Date('2024-06-01'),
      })

      // Extract the SMS body
      let callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      let smsBody = callArgs.body

      // Verify that the body contains the default deadline "3 jours"
      expect(smsBody).toContain('3 jours')

      // Clear and test with custom deadline
      mockTwilioClient.messages.create.mockClear()

      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Luc Petit',
        activityTitle: 'Conférence Tech',
        activityDate: new Date('2024-07-15'),
        deadlineDays: 7,
      })

      // Extract the SMS body
      callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      smsBody = callArgs.body

      // Verify that the body contains the custom deadline "7 jours"
      expect(smsBody).toContain('7 jours')
    })

    it('should include frontend URL with /employee/activities path in SMS body', async () => {
      // Validates: Requirements 6.5
      // Test with custom URL
      const customUrl = 'https://custom-domain.com'

      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'Ahmed Ben Ali',
        activityTitle: 'Formation React',
        activityDate: new Date('2024-08-01'),
        frontendUrl: customUrl,
      })

      // Extract the SMS body
      let callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      let smsBody = callArgs.body

      // Verify that the body contains the URL with the correct path
      expect(smsBody).toContain(`${customUrl}/employee/activities`)

      // Clear and test with default URL
      mockTwilioClient.messages.create.mockClear()

      // Store original env value
      const originalFrontendUrl = process.env.FRONTEND_URL
      process.env.FRONTEND_URL = 'http://localhost:5173'

      await service.sendRecommendationReminder({
        to: '+33612345678',
        employeeName: 'François Dubois',
        activityTitle: 'Atelier DevOps',
        activityDate: new Date('2024-09-10'),
      })

      // Extract the SMS body
      callArgs = mockTwilioClient.messages.create.mock.calls[0][0]
      smsBody = callArgs.body

      // Verify that the body contains the default URL with the correct path
      expect(smsBody).toContain('http://localhost:5173/employee/activities')

      // Restore original env value
      if (originalFrontendUrl !== undefined) {
        process.env.FRONTEND_URL = originalFrontendUrl
      } else {
        delete process.env.FRONTEND_URL
      }
    })
  })
})
