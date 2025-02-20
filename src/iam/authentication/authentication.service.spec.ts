import { UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mockAccessToken'),
  verifyAsync: jest.fn(),
};

const mockHashingService = {
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
};

const mockRefreshTokenStorage = {
  insert: jest.fn(),
  validate: jest.fn().mockResolvedValue(true),
  invalidate: jest.fn(),
};

const mockJwtConfig: ConfigType<typeof jwtConfig> = {
  secret: 'secret',
  accessTokenTtl: 300,
  refreshTokenTtl: 3600,
  audience: 'audience',
  issuer: 'issuer',
};

describe('AuthenticationService', () => {
  let authService: AuthenticationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: HashingService, useValue: mockHashingService },
        {
          provide: RefreshTokenIdsStorage,
          useValue: mockRefreshTokenStorage,
        },
        { provide: jwtConfig.KEY, useValue: mockJwtConfig },
      ],
    }).compile();

    authService = module.get<AuthenticationService>(AuthenticationService);

    // Clear previous mock data
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    it('should throw an error if the user already exists', async () => {
      const existingUser = {
        id: 3,
        name: 'Admin User',
        email: 'admin@example.com',
        password:
          '$2b$10$fjte5CTKMjM4ar4Ett9/IeFsBZhyXD0KjH8x/5OfbXljqaDG9zZ6G',
        role: 'ADMIN',
        createdAt: new Date('2025-02-20T16:11:30.269Z'),
        updatedAt: new Date('2025-02-20T16:11:30.269Z'),
      };

      // Mock `findUnique` to return an existing user
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      const dto: SignUpDto = {
        email: 'admin@example.com',
        password: 'password123',
      };

      await expect(authService.signUp(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      // Ensure `findUnique` was called with correct parameters
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      // Ensure `create` was never called
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should create a new user if email is not in use', async () => {
      const dto: SignUpDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      // Mock `findUnique` to return null (user does not exist)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      mockHashingService.hash.mockResolvedValueOnce('hashedPassword');

      // Mock `create` to return a new user object
      const newUser = {
        id: 4,
        email: dto.email,
        name: dto.email,
        password: 'hashedPassword',
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValueOnce(newUser);

      const result = await authService.signUp(dto);

      expect(result).toEqual(undefined); // signUp doesn't return anything

      // Ensure `findUnique` was called to check existence
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      // Ensure `hash` was called
      expect(mockHashingService.hash).toHaveBeenCalledWith(dto.password);

      // Ensure `create` was called with hashed password
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          name: dto.email,
          password: 'hashedPassword', // mockHashingService.hash is used
          role: 'STUDENT',
        },
      });

      // Ensure password was hashed before storing
      expect(mockHashingService.hash).toHaveBeenCalledWith(dto.password);
    });
  });

  describe('signIn', () => {
    it('should throw an error if the user does not exist', async () => {
      const dto = { email: 'nonexistent@example.com', password: 'password123' };

      // Mock `findUnique` to return null (user does not exist)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(authService.signIn(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });

    it('should throw an error if the password is incorrect', async () => {
      const existingUser = {
        id: 1,
        email: 'user@example.com',
        password: 'hashedPassword',
        role: 'STUDENT',
      };

      const dto = { email: 'user@example.com', password: 'wrongPassword' };

      // Mock `findUnique` to return an existing user
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
      // Mock `compare` to return false (password mismatch)
      mockHashingService.compare.mockResolvedValueOnce(false);

      await expect(authService.signIn(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockHashingService.compare).toHaveBeenCalledWith(
        dto.password,
        existingUser.password,
      );
    });

    it('should return tokens if credentials are correct', async () => {
      const existingUser = {
        id: 1,
        email: 'user@example.com',
        password: 'hashedPassword',
        role: 'STUDENT',
      };

      const dto = { email: 'user@example.com', password: 'password123' };

      // Mock `findUnique` to return an existing user
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
      // Mock `compare` to return true (password match)
      mockHashingService.compare.mockResolvedValueOnce(true);
      // Mock `signAsync` to return mock tokens
      mockJwtService.signAsync.mockResolvedValueOnce('mockAccessToken');
      mockJwtService.signAsync.mockResolvedValueOnce('mockRefreshToken');

      const result = await authService.signIn(dto);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockHashingService.compare).toHaveBeenCalledWith(
        dto.password,
        existingUser.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockRefreshTokenStorage.insert).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw an UnauthorizedException if token verification fails', async () => {
      const dto = { refreshToken: 'invalidToken' };

      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('Invalid token'),
      );

      await expect(authService.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if user does not exist', async () => {
      const dto = { refreshToken: 'validToken' };
      const decodedToken = { sub: 1, refreshTokenId: 'refreshId' };

      mockJwtService.verifyAsync.mockResolvedValueOnce(decodedToken);
      mockPrisma.user.findUniqueOrThrow.mockRejectedValueOnce(
        new Error('User not found'),
      );

      await expect(authService.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if refresh token is invalid', async () => {
      const dto = { refreshToken: 'validToken' };
      const decodedToken = { sub: 1, refreshTokenId: 'refreshId' };
      const existingUser = { id: 1, email: 'user@example.com' };

      mockJwtService.verifyAsync.mockResolvedValueOnce(decodedToken);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValueOnce(existingUser);
      mockRefreshTokenStorage.validate.mockResolvedValueOnce(false);

      await expect(authService.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens if refresh token is valid', async () => {
      const dto = { refreshToken: 'validToken' };
      const decodedToken = { sub: 1, refreshTokenId: 'refreshId' };
      const existingUser = { id: 1, email: 'user@example.com' };

      mockJwtService.verifyAsync.mockResolvedValueOnce(decodedToken);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValueOnce(existingUser);
      mockRefreshTokenStorage.validate.mockResolvedValueOnce(true);
      mockJwtService.signAsync.mockResolvedValueOnce('mockAccessToken');
      mockJwtService.signAsync.mockResolvedValueOnce('mockRefreshToken');

      const result = await authService.refreshTokens(dto);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });

      expect(mockRefreshTokenStorage.invalidate).toHaveBeenCalledWith(
        existingUser.id,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockRefreshTokenStorage.insert).toHaveBeenCalledWith(
        existingUser.id,
        expect.any(String),
      );
    });
  });
});
