# Design Document: SMS Service Unit Tests

## Overview

This design document defines the architecture and testing strategy for comprehensive unit tests of the SmsService in the NestJS backend. The SmsService is responsible for sending SMS notifications via Twilio to employees recommended for activities.

The test suite will validate:
- Service initialization with various credential configurations
- SMS sending functionality with proper message formatting
- Phone number normalization to E.164 format
- Error handling and graceful degradation
- Integration with ConfigService for environment variables

**Testing Framework:** Jest (NestJS standard)
**Testing Approach:** Unit testing with complete mocking of external dependencies
**Target File:** `backend/src/sms/sms.service.spec.ts`

## Architecture

### Test Structure

The test suite follows NestJS testing conventions using `@nestjs/testing` module for dependency injection and Jest for assertions and mocking.

```
backend/src/sms/
├── sms.service.ts          # Implementation
├── sms.service.spec.ts     # Unit tests (to be created)
└── sms.module.ts           # Module definition
```

### Test Organization

Tests are organized into logical describe blocks:

1. **Service Initialization Tests** - Validate constructor behavior with various credential configurations
2. **SMS Sending Tests** - Validate sendRecommendationReminder method
3. **Phone Normalization Tests** - Validate normalizePhone private method (via public method behavior)
4. **Error Handling Tests** - Validate graceful error handling
5. **ConfigService Integration Tests** - Validate environment variable retrieval
6. **Message Formatting Tests** - Validate SMS content generation

### Dependency Mocking Strategy

**ConfigService Mock:**
```typescript
const mockConfigService = {
  get: jest.fn((key: string) => {
    // Return values based on test scenario
  })
}
```

**Twilio Client Mock:**
```typescript
const mockTwilioClient = {
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'SM123' })
  }
}
```

**Logger Mock:**
The NestJS Logger is automatically mocked by the testing module, but we'll spy on its methods to verify logging behavior.

## Components and Interfaces

### Test Module Setup

Each test will use the NestJS Testing module to create an isolated instance:

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    SmsService,
    {
      provide: ConfigService,
      useValue: mockConfigService
    }
  ]
}).compile()
```

### Mock Interfaces

**ConfigService Mock Interface:**
- `get<T>(key: string): T | undefined` - Returns mocked environment variables

**Twilio Client Mock Interface:**
- `messages.create(options: MessageOptions): Promise<MessageInstance>` - Simulates SMS sending

### Test Utilities

**Helper Functions:**
- `createServiceWithConfig(config: Partial<TwilioConfig>)` - Factory function to create service instances with specific configurations
- `expectTwilioClientToBeNull(service: SmsService)` - Assertion helper for null client validation
- `extractSmsBody(mockCall: any)` - Extracts SMS body from Twilio mock call for assertions

## Data Models

### Test Data Structures

**Valid Twilio Configuration:**
```typescript
interface ValidTwilioConfig {
  TWILIO_ACCOUNT_SID: string    // Starts with "AC", length > 10
  TWILIO_AUTH_TOKEN: string     // Length > 10
  TWILIO_PHONE_NUMBER: string   // Valid E.164 format
}
```

**SMS Parameters:**
```typescript
interface SmsTestParams {
  to: string
  employeeName: string
  activityTitle: string
  activityDate: Date | string
  deadlineDays?: number
  frontendUrl?: string
}
```

**Phone Number Test Cases:**
```typescript
interface PhoneTestCase {
  input: string
  expected: string | null
  description: string
}
```

### Test Data Examples

**Valid Credentials:**
- TWILIO_ACCOUNT_SID: "AC1234567890abcdef1234567890abcd"
- TWILIO_AUTH_TOKEN: "auth_token_12345"
- TWILIO_PHONE_NUMBER: "+21612345678"

**Invalid Credentials:**
- Invalid SID: "XX1234567890" (doesn't start with "AC")
- Short token: "short" (≤10 characters)
- Missing phone: "" or undefined

**Phone Number Examples:**
- Tunisian 8-digit: "12345678" → "+21612345678"
- E.164 format: "+33612345678" → "+33612345678"
- With "00" prefix: "0033612345678" → "+33612345678"
- With formatting: "(123) 456-7890" → cleaned and validated
- Invalid: "abc123" → null

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the prework, I identified several areas where properties can be consolidated:

**Consolidation Opportunities:**
1. Properties 6.1, 6.2, 6.3, 6.4, 6.5 (message content validation) can be combined into a single comprehensive property that validates all required fields are present in the SMS body
2. Properties 4.1 and 4.2 (error handling) can be combined into a single property that validates both logging and non-throwing behavior
3. Properties 4.3 and 4.4 (invalid phone handling) can be combined into a single property
4. Properties 3.1, 3.2, 3.3, 3.4 (phone normalization) represent different transformation rules that should remain separate as they test distinct normalization behaviors

**Redundancy Elimination:**
- Property 2.1 (Twilio client called with correct parameters) subsumes the need to separately verify individual parameter correctness
- Properties 5.1, 5.2, 5.3 (ConfigService calls) can be verified in initialization examples rather than as separate properties

### Property 1: Phone Normalization - Tunisian Numbers

*For any* 8-digit numeric string, normalizePhone should return the string prefixed with "+216"

**Validates: Requirements 3.1**

### Property 2: Phone Normalization - E.164 Idempotence

*For any* valid E.164 formatted phone number (starting with "+" followed by 7-15 digits), normalizePhone should return the number unchanged

**Validates: Requirements 3.2**

### Property 3: Phone Normalization - International Prefix Conversion

*For any* phone number starting with "00" followed by 7-15 digits, normalizePhone should convert the "00" prefix to "+"

**Validates: Requirements 3.3**

### Property 4: Phone Normalization - Formatting Character Removal

*For any* phone number containing spaces, hyphens, parentheses, or dots, normalizePhone should remove these characters before validation

**Validates: Requirements 3.4**

### Property 5: Phone Normalization - Invalid Input Handling

*For any* input that doesn't match valid phone number patterns (8 digits, E.164, or 00-prefix), normalizePhone should return null

**Validates: Requirements 3.6**

### Property 6: SMS Content Completeness

*For any* valid SMS parameters (employeeName, activityTitle, activityDate, deadlineDays, frontendUrl), the generated SMS body should contain all five elements: employee name, activity title, formatted date, deadline in days, and frontend URL with "/employee/activities" path

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 7: Custom Deadline Propagation

*For any* custom deadlineDays value provided to sendRecommendationReminder, the SMS body should contain that exact deadline value

**Validates: Requirements 2.4**

### Property 8: Twilio Client Invocation

*For any* valid SMS parameters when Twilio client is initialized, sendRecommendationReminder should invoke client.messages.create with body, from, and to parameters matching the input

**Validates: Requirements 2.1**

### Property 9: Tunisian Phone Number Normalization in SMS

*For any* 8-digit Tunisian phone number provided to sendRecommendationReminder, the number should be normalized to E.164 format (+216XXXXXXXX) before being passed to Twilio

**Validates: Requirements 2.2**

### Property 10: Error Resilience

*For any* error thrown by Twilio client.messages.create, sendRecommendationReminder should log the error and complete without throwing

**Validates: Requirements 4.1, 4.2**

### Property 11: Invalid Phone Number Handling

*For any* invalid phone number provided to sendRecommendationReminder, the method should log a warning and return without attempting to send SMS

**Validates: Requirements 4.3, 4.4**

### Property 12: Graceful Credential Handling

*For any* undefined or invalid credential returned by ConfigService, the service should initialize without throwing and set client to null

**Validates: Requirements 5.4**

## Error Handling

### Error Scenarios

**1. Twilio API Errors**
- **Scenario:** Twilio client.messages.create throws an error
- **Handling:** Log error with logger.error, do not throw, return gracefully
- **Test:** Mock Twilio to throw, verify logger.error called, verify no exception

**2. Invalid Phone Numbers**
- **Scenario:** Phone number fails normalization (returns null)
- **Handling:** Log warning with logger.warn, skip SMS sending, return immediately
- **Test:** Provide invalid phone, verify logger.warn called, verify Twilio not called

**3. Missing Credentials**
- **Scenario:** ConfigService returns undefined for required credentials
- **Handling:** Log warning, set client to null, service remains functional
- **Test:** Mock ConfigService to return undefined, verify warning logged, verify client is null

**4. Invalid Credentials**
- **Scenario:** Credentials don't meet validation rules (SID doesn't start with "AC", token too short)
- **Handling:** Log warning, set client to null, service remains functional
- **Test:** Mock ConfigService with invalid values, verify warning logged, verify client is null

**5. Twilio Initialization Failure**
- **Scenario:** twilio.default() throws during construction
- **Handling:** Catch error, log warning, set client to null
- **Test:** Mock twilio module to throw, verify warning logged, verify service still created

### Non-Throwing Guarantee

All error scenarios must be non-blocking. The service should never throw exceptions that would break the main application flow. SMS sending is a secondary feature that should fail silently with appropriate logging.

## Testing Strategy

### Dual Testing Approach

This test suite uses **unit testing exclusively** as the service has no complex business logic requiring property-based testing. All behaviors can be validated with specific examples and edge cases.

**Unit Tests:**
- Specific examples of valid and invalid configurations
- Edge cases (empty strings, null values, boundary conditions)
- Error conditions (Twilio failures, invalid inputs)
- Integration points (ConfigService, Logger)

**Why No Property-Based Tests:**
While the design includes correctness properties for clarity, the SmsService is primarily a wrapper around Twilio with simple validation logic. The phone normalization logic has a finite set of patterns that can be exhaustively tested with unit tests. Property-based testing would add complexity without significant benefit for this service.

### Test Organization

**Test Suites:**

1. **Service Initialization**
   - Valid credentials → client initialized
   - Invalid SID → client null
   - Short token → client null
   - Missing phone → client null
   - All missing → client null, no throw
   - Twilio init failure → client null, warning logged

2. **SMS Sending - Happy Path**
   - Valid params + initialized client → Twilio called correctly
   - Default deadline (no param) → "3 jours" in body
   - Custom deadline → custom value in body
   - Default URL (no param) → fallback URL in body
   - Custom URL → custom URL in body

3. **SMS Sending - Edge Cases**
   - Client null → return immediately, no Twilio call
   - Invalid phone → warning logged, no Twilio call
   - Tunisian 8-digit → normalized to +216

4. **Phone Normalization**
   - 8 digits → +216 prefix
   - E.164 format → unchanged
   - "00" prefix → converted to "+"
   - With spaces/hyphens/parens → cleaned
   - Empty string → null
   - Null input → null
   - Invalid format → null

5. **Error Handling**
   - Twilio throws → error logged, no throw
   - Invalid phone → warning logged, no SMS attempt

6. **ConfigService Integration**
   - Service creation → ConfigService.get called 3 times
   - Undefined credentials → handled gracefully
   - Valid credentials → used for Twilio init

7. **Message Formatting**
   - Employee name present in body
   - Activity title present in body
   - Date formatted in French (dd month yyyy)
   - Deadline present in body
   - URL with /employee/activities present in body

### Test Configuration

**Jest Configuration:**
- Test file: `backend/src/sms/sms.service.spec.ts`
- Coverage target: 100% (service is small and fully testable)
- Mocking: All external dependencies (ConfigService, Twilio, Logger)

**Mock Setup Pattern:**
```typescript
beforeEach(() => {
  jest.clearAllMocks()
  mockConfigService.get.mockImplementation((key: string) => {
    // Return test-specific values
  })
})
```

### Test Execution

**Run Commands:**
- All tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:cov`
- Specific file: `npm test sms.service.spec`

### Coverage Goals

- **Line Coverage:** 100%
- **Branch Coverage:** 100%
- **Function Coverage:** 100%
- **Statement Coverage:** 100%

The service is small enough that complete coverage is achievable and maintainable.
