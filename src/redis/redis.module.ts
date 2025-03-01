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
          host: redisConfiguration.host,
          port: redisConfiguration.port,
          password: redisConfiguration.password,
          family: redisConfiguration.family,
        });
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
