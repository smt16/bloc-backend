import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = (configService: ConfigService): void => {
  const dsn = configService.get<string>('sentry.dsn');

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: configService.get<string>('sentry.environment'),
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
  });
};

@Module({})
export class MonitoringModule {}
