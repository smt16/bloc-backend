import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.config';

export const InjectRedis = () => Inject(REDIS_CLIENT);
