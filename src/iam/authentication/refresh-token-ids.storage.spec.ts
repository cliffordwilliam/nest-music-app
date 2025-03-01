import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';

const mockRedisClient = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

describe('RefreshTokenIdsStorage', () => {
  let refreshTokenIdsStorage: RefreshTokenIdsStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenIdsStorage,
        { provide: REDIS_CLIENT, useValue: mockRedisClient },
      ],
    }).compile();

    refreshTokenIdsStorage = module.get<RefreshTokenIdsStorage>(
      RefreshTokenIdsStorage,
    );

    // Clear previous mock data
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(refreshTokenIdsStorage).toBeDefined();
  });

  describe('insert', () => {
    it('should store tokenId in Redis', async () => {
      const userId = 1;
      const tokenId = 'token123';

      await refreshTokenIdsStorage.insert(userId, tokenId);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `user-${userId}`,
        tokenId,
      );
    });
  });

  describe('validate', () => {
    it('should return true if tokenId matches stored value', async () => {
      const userId = 1;
      const tokenId = 'token123';
      mockRedisClient.get.mockResolvedValue(tokenId);

      const isValid = await refreshTokenIdsStorage.validate(userId, tokenId);

      expect(mockRedisClient.get).toHaveBeenCalledWith(`user-${userId}`);
      expect(isValid).toBe(true);
    });

    it('should return false if tokenId does not match stored value', async () => {
      const userId = 1;
      const tokenId = 'token123';
      mockRedisClient.get.mockResolvedValue('differentToken');

      const isValid = await refreshTokenIdsStorage.validate(userId, tokenId);

      expect(mockRedisClient.get).toHaveBeenCalledWith(`user-${userId}`);
      expect(isValid).toBe(false);
    });

    it('should return false if no tokenId is stored', async () => {
      const userId = 1;
      mockRedisClient.get.mockResolvedValue(null);

      const isValid = await refreshTokenIdsStorage.validate(userId, 'token123');

      expect(mockRedisClient.get).toHaveBeenCalledWith(`user-${userId}`);
      expect(isValid).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should delete the tokenId from Redis', async () => {
      const userId = 1;

      await refreshTokenIdsStorage.invalidate(userId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(`user-${userId}`);
    });
  });
});
