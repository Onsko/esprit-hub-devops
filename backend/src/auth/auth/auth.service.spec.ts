import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../../users/users.service'
import * as bcrypt from 'bcrypt'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('bcrypt')
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
}

const mockJwtService = {
  sign: jest.fn(),
  verifyAsync: jest.fn(),
}

// ── Factory ───────────────────────────────────────────────────────────────────

const createMockUser = (overrides: any = {}) => ({
  _id: 'user-id-123',
  id: 'user-id-123',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // ── validateUser ──────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('should return null when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      const result = await service.validateUser('unknown@test.com', 'password')
      expect(result).toBeNull()
    })

    it('should normalize email to lowercase before lookup', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      await service.validateUser('  TEST@EXAMPLE.COM  ', 'password')
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should throw UnauthorizedException when user status is not ACTIVE', async () => {
      const inactiveUser = createMockUser({ status: 'INACTIVE' })
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser)

      await expect(service.validateUser('test@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with correct message for inactive account', async () => {
      const inactiveUser = createMockUser({ status: 'PENDING' })
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser)

      await expect(service.validateUser('test@example.com', 'password'))
        .rejects.toThrow("Votre compte n'est pas actif")
    })

    it('should return null when bcrypt password comparison fails', async () => {
      const user = createMockUser({ password: '$2b$10$hashedpassword' })
      mockUsersService.findByEmail.mockResolvedValue(user)
      ;(mockBcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await service.validateUser('test@example.com', 'wrongpassword')
      expect(result).toBeNull()
    })

    it('should return user when bcrypt password comparison succeeds', async () => {
      const user = createMockUser()
      mockUsersService.findByEmail.mockResolvedValue(user)
      ;(mockBcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.validateUser('test@example.com', 'correctpassword')
      expect(result).toBe(user)
    })

    it('should handle bcrypt compare throwing an error gracefully', async () => {
      const user = createMockUser()
      mockUsersService.findByEmail.mockResolvedValue(user)
      ;(mockBcrypt.compare as jest.Mock).mockRejectedValue(new Error('bcrypt error'))

      const result = await service.validateUser('test@example.com', 'password')
      expect(result).toBeNull()
    })

    it('should handle legacy plaintext password and auto-migrate to bcrypt', async () => {
      const user = createMockUser({ password: 'plaintextpassword' })
      mockUsersService.findByEmail.mockResolvedValue(user)
      ;(mockBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash')

      const result = await service.validateUser('test@example.com', 'plaintextpassword')
      expect(result).toBe(user)
      expect(mockBcrypt.hash).toHaveBeenCalledWith('plaintextpassword', 10)
      expect(user.save).toHaveBeenCalled()
    })

    it('should return null for wrong plaintext password', async () => {
      const user = createMockUser({ password: 'correctpassword' })
      mockUsersService.findByEmail.mockResolvedValue(user)

      const result = await service.validateUser('test@example.com', 'wrongpassword')
      expect(result).toBeNull()
    })
  })

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return access_token and refresh_token', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-456')

      const user = createMockUser()
      const result = await service.login(user)

      expect(result).toHaveProperty('access_token', 'access-token-123')
      expect(result).toHaveProperty('refresh_token', 'refresh-token-456')
    })

    it('should sign JWT with correct payload (sub and role)', async () => {
      mockJwtService.sign.mockReturnValue('token')
      const user = createMockUser({ _id: 'abc123', role: 'HR' })

      await service.login(user)

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'abc123', role: 'HR' }),
        expect.any(Object),
      )
    })

    it('should call jwtService.sign twice (access + refresh)', async () => {
      mockJwtService.sign.mockReturnValue('token')
      await service.login(createMockUser())
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2)
    })

    it('should use JWT_EXPIRES_IN env variable for access token', async () => {
      process.env.JWT_EXPIRES_IN = '2h'
      mockJwtService.sign.mockReturnValue('token')

      await service.login(createMockUser())

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: '2h' }),
      )
      delete process.env.JWT_EXPIRES_IN
    })

    it('should use default "1h" when JWT_EXPIRES_IN is not set', async () => {
      delete process.env.JWT_EXPIRES_IN
      mockJwtService.sign.mockReturnValue('token')

      await service.login(createMockUser())

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: '1h' }),
      )
    })
  })

  // ── refreshAccessToken ────────────────────────────────────────────────────

  describe('refreshAccessToken', () => {
    it('should return new access_token when refresh token is valid', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123', role: 'EMPLOYEE' })
      mockUsersService.findById.mockResolvedValue(createMockUser())
      mockJwtService.sign.mockReturnValue('new-access-token')

      const result = await service.refreshAccessToken('valid-refresh-token')

      expect(result).toHaveProperty('access_token', 'new-access-token')
    })

    it('should call verifyAsync with the refresh secret', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123', role: 'EMPLOYEE' })
      mockUsersService.findById.mockResolvedValue(createMockUser())
      mockJwtService.sign.mockReturnValue('token')

      await service.refreshAccessToken('valid-refresh-token')

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({ secret: expect.any(String) }),
      )
    })

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'))

      await expect(service.refreshAccessToken('invalid-token'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with correct message for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'))

      await expect(service.refreshAccessToken('expired-token'))
        .rejects.toThrow('Refresh token invalide ou expiré')
    })

    it('should use user id from decoded token to fetch user', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'decoded-user-id', role: 'HR' })
      mockUsersService.findById.mockResolvedValue(createMockUser({ id: 'decoded-user-id' }))
      mockJwtService.sign.mockReturnValue('token')

      await service.refreshAccessToken('valid-token')

      expect(mockUsersService.findById).toHaveBeenCalledWith('decoded-user-id')
    })

    it('should sign new access token with correct payload', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', role: 'MANAGER' })
      mockUsersService.findById.mockResolvedValue(createMockUser({ id: 'user-id', role: 'MANAGER' }))
      mockJwtService.sign.mockReturnValue('token')

      await service.refreshAccessToken('valid-token')

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'MANAGER' }),
        expect.any(Object),
      )
    })
  })
})
