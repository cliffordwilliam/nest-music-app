import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from './config/redis.config';
import { REDIS_CLIENT } from './redis.constants';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (redisConfiguration: ConfigType<typeof redisConfig>) => {
        return new Redis({
          ...redisConfiguration,
          family: 4, // Force IPv4
        });
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
