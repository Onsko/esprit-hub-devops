import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException, ServiceUnavailableException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { AuthService } from '../auth/auth/auth.service'
import { JwtAuthGuard } from '../auth/auth/jwt-auth/jwt-auth.guard'
import { RolesGuard } from '../auth/auth/roles/roles.guard'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  sanitizeUser: jest.fn(),
  findOrCreateGoogleUser: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  updateOnlineStatus: jest.fn(),
  getAllUserCompetences: jest.fn(),
  getUserFiches: jest.fn(),
  getFicheCompetences: jest.fn(),
  getAllCompetences: jest.fn(),
  getAllQuestionCompetences: jest.fn(),
  createQuestionCompetence: jest.fn(),
}

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
  refreshAccessToken: jest.fn(),
}

// ── Factory ───────────────────────────────────────────────────────────────────

const createMockUser = (overrides: any = {}) => ({
  _id: 'user-id-123',
  email: 'test@example.com',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  ...overrides,
})

const createSanitizedUser = (overrides: any = {}) => ({
  _id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'EMPLOYEE',
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UsersController — Auth Endpoints', () => {
  let controller: UsersController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: Reflector, useValue: { get: jest.fn() } },
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  // ── POST /users/register ──────────────────────────────────────────────────

  describe('register', () => {
    it('should call usersService.create with the DTO', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        matricule: 'EMP001',
        telephone: '12345678',
        date_embauche: '2024-01-01',
      } as any

      mockUsersService.create.mockResolvedValue({ message: 'Utilisateur créé', user: createSanitizedUser() })

      const result = await controller.register(dto)

      expect(mockUsersService.create).toHaveBeenCalledWith(dto)
      expect(result).toHaveProperty('message')
    })

    it('should return the result from usersService.create', async () => {
      const expected = { message: 'Utilisateur créé avec succès', user: createSanitizedUser() }
      mockUsersService.create.mockResolvedValue(expected)

      const result = await controller.register({} as any)
      expect(result).toEqual(expected)
    })
  })

  // ── POST /users/login ─────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' } as any

    it('should return tokens and user on successful login', async () => {
      const user = createMockUser()
      const sanitized = createSanitizedUser()
      mockAuthService.validateUser.mockResolvedValue(user)
      mockAuthService.login.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      })
      mockUsersService.sanitizeUser.mockReturnValue(sanitized)

      const result = await controller.login(loginDto)

      expect(result).toEqual({
        message: 'Connexion réussie',
        user: sanitized,
        token: 'access-token',
        refresh_token: 'refresh-token',
      })
    })

    it('should call authService.validateUser with email and password', async () => {
      const user = createMockUser()
      mockAuthService.validateUser.mockResolvedValue(user)
      mockAuthService.login.mockResolvedValue({ access_token: 'token', refresh_token: 'rtoken' })
      mockUsersService.sanitizeUser.mockReturnValue(createSanitizedUser())

      await controller.login(loginDto)

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password)
    })

    it('should throw UnauthorizedException when validateUser returns null', async () => {
      mockAuthService.validateUser.mockResolvedValue(null)

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with correct message for invalid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(null)

      await expect(controller.login(loginDto))
        .rejects.toThrow('Email ou mot de passe incorrect')
    })

    it('should call authService.login with the validated user', async () => {
      const user = createMockUser()
      mockAuthService.validateUser.mockResolvedValue(user)
      mockAuthService.login.mockResolvedValue({ access_token: 'token', refresh_token: 'rtoken' })
      mockUsersService.sanitizeUser.mockReturnValue(createSanitizedUser())

      await controller.login(loginDto)

      expect(mockAuthService.login).toHaveBeenCalledWith(user)
    })

    it('should call usersService.sanitizeUser with the validated user', async () => {
      const user = createMockUser()
      mockAuthService.validateUser.mockResolvedValue(user)
      mockAuthService.login.mockResolvedValue({ access_token: 'token', refresh_token: 'rtoken' })
      mockUsersService.sanitizeUser.mockReturnValue(createSanitizedUser())

      await controller.login(loginDto)

      expect(mockUsersService.sanitizeUser).toHaveBeenCalledWith(user)
    })
  })

  // ── POST /users/refresh ───────────────────────────────────────────────────

  describe('refresh', () => {
    it('should return new access token when refresh token is valid', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue({ access_token: 'new-access-token' })

      const result = await controller.refresh('valid-refresh-token')

      expect(result).toEqual({ token: 'new-access-token' })
    })

    it('should call authService.refreshAccessToken with the token', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue({ access_token: 'token' })

      await controller.refresh('my-refresh-token')

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith('my-refresh-token')
    })

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      await expect(controller.refresh(undefined as any))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with correct message when token is missing', async () => {
      await expect(controller.refresh(undefined as any))
        .rejects.toThrow('Refresh token manquant')
    })

    it('should propagate UnauthorizedException from authService', async () => {
      mockAuthService.refreshAccessToken.mockRejectedValue(
        new UnauthorizedException('Refresh token invalide ou expiré'),
      )

      await expect(controller.refresh('expired-token'))
        .rejects.toThrow('Refresh token invalide ou expiré')
    })
  })

  // ── GET /users/google/login ───────────────────────────────────────────────

  describe('googleLogin', () => {
    it('should throw ServiceUnavailableException when Google OAuth is not configured', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID
      const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET

      await expect(controller.googleLogin()).rejects.toThrow(ServiceUnavailableException)

      process.env.GOOGLE_CLIENT_ID = originalClientId
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret
    })

    it('should throw ServiceUnavailableException with correct message', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID
      const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET

      await expect(controller.googleLogin())
        .rejects.toThrow('Google OAuth non configuré')

      process.env.GOOGLE_CLIENT_ID = originalClientId
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret
    })
  })

  // ── GET /users/google/callback ────────────────────────────────────────────

  describe('googleCallback', () => {
    const mockRes = {
      redirect: jest.fn(),
    }

    beforeEach(() => {
      mockRes.redirect.mockClear()
    })

    it('should redirect to error URL when Google OAuth is not configured', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID
      const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET

      await controller.googleCallback({ user: { email: 'test@gmail.com' } }, mockRes as any)

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('google_oauth_not_configured'),
      )

      process.env.GOOGLE_CLIENT_ID = originalClientId
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret
    })

    it('should redirect to error URL when google user has no email', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id'
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'

      await controller.googleCallback({ user: null }, mockRes as any)

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('google_auth_failed'),
      )

      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET
    })

    it('should redirect with tokens on successful Google OAuth', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id'
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
      process.env.FRONTEND_URL = 'http://localhost:5173'

      const googleUser = { email: 'user@gmail.com', name: 'Google User', providerId: '12345' }
      const user = createMockUser()
      const sanitized = createSanitizedUser()

      mockUsersService.findOrCreateGoogleUser.mockResolvedValue(user)
      mockAuthService.login.mockResolvedValue({
        access_token: 'google-access-token',
        refresh_token: 'google-refresh-token',
      })
      mockUsersService.sanitizeUser.mockReturnValue(sanitized)

      await controller.googleCallback({ user: googleUser }, mockRes as any)

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('google-access-token'),
      )

      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET
      delete process.env.FRONTEND_URL
    })
  })
})
