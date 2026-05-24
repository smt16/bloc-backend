import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRedisClient, REDIS_CLIENT } from './redis.config';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: createRedisClient,
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
