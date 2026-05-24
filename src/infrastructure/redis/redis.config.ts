import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const createRedisClient = (configService: ConfigService): Redis => {
  return new Redis({
    host: configService.get<string>('redis.host'),
    port: configService.get<number>('redis.port'),
    maxRetriesPerRequest: null,
  });
};

export const getRedisConnectionOptions = (configService: ConfigService) => ({
  host: configService.get<string>('redis.host'),
  port: configService.get<number>('redis.port'),
});
