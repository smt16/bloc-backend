import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly client: PostHog | null;

  constructor(private readonly configService: ConfigService) {
    const enabled = this.configService.get<boolean>('posthog.enabled');
    const apiKey = this.configService.get<string>('posthog.apiKey');

    this.client =
      enabled && apiKey
        ? new PostHog(apiKey, {
            host: this.configService.get<string>('posthog.host'),
          })
        : null;
  }

  capture(
    event: string,
    distinctId: string,
    properties?: Record<string, unknown>,
  ): void {
    if (!this.client) {
      this.logger.debug(`PostHog disabled, skipping event: ${event}`);
      return;
    }

    this.client.capture({
      event,
      distinctId,
      properties,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
