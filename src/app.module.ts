import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppConfigModule } from './config/config.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HealthModule } from './health/health.module';
import { AnalyticsModule } from './infrastructure/analytics/analytics.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { MediaInfrastructureModule } from './infrastructure/media/media.module';
import { MonitoringModule } from './infrastructure/monitoring/monitoring.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RealtimeModule } from './infrastructure/realtime/realtime.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AnalyticsEventsModule } from './modules/analytics-events/analytics-events.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClimbingModule } from './modules/climbing/climbing.module';
import { CrewsModule } from './modules/crews/crews.module';
import { FeedModule } from './modules/feed/feed.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { MediaProcessingModule } from './modules/media-processing/media-processing.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: 120,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.refreshToken',
            'req.body.accessToken',
            'req.body.idToken',
            'req.body.client_secret',
            'req.body.clientSecret',
          ],
          remove: true,
        },
      },
    }),
    SentryModule.forRoot(),
    MonitoringModule,
    DatabaseModule,
    RedisModule,
    QueueModule,
    StorageModule,
    MediaInfrastructureModule,
    AnalyticsModule,
    RealtimeModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ClimbingModule,
    FeedModule,
    MediaProcessingModule,
    NotificationsModule,
    GymsModule,
    CrewsModule,
    AnalyticsEventsModule,
    MessagingModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
