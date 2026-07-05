import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from '../auth0.types';

export interface Auth0ProfileFields {
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Fetches profile fields from Auth0's /userinfo endpoint when they are not
 * present as custom claims on the access token.
 */
@Injectable()
export class Auth0UserInfoService {
  private readonly logger = new Logger(Auth0UserInfoService.name);
  private readonly userinfoUrl: string;

  constructor(configService: ConfigService) {
    const domain = configService.getOrThrow<string>('auth0.domain');
    this.userinfoUrl = `https://${domain}/userinfo`;
  }

  /**
   * Returns identity fields from token claims, falling back to /userinfo when
   * email/name/picture are missing and a bearer token is available.
   */
  async resolveProfileFields(
    auth: AuthenticatedUser,
  ): Promise<Auth0ProfileFields> {
    const fromToken: Auth0ProfileFields = {
      email: auth.email,
      name: auth.name,
      picture: auth.picture,
    };

    if (fromToken.email && fromToken.name && fromToken.picture) {
      return fromToken;
    }

    if (!auth.accessToken) {
      return fromToken;
    }

    const fromUserInfo = await this.fetchProfile(auth.accessToken);
    if (!fromUserInfo) {
      return fromToken;
    }

    return {
      email: fromToken.email ?? fromUserInfo.email,
      name: fromToken.name ?? fromUserInfo.name,
      picture: fromToken.picture ?? fromUserInfo.picture,
    };
  }

  private async fetchProfile(
    accessToken: string,
  ): Promise<Auth0ProfileFields | null> {
    try {
      const response = await fetch(this.userinfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        this.logger.debug(
          `Auth0 /userinfo returned ${response.status} for ${this.userinfoUrl}`,
        );
        return null;
      }

      const data = (await response.json()) as Record<string, unknown>;
      return {
        email:
          typeof data.email === 'string' && data.email.length > 0
            ? data.email
            : undefined,
        name:
          typeof data.name === 'string' && data.name.length > 0
            ? data.name
            : typeof data.nickname === 'string' && data.nickname.length > 0
              ? data.nickname
              : undefined,
        picture:
          typeof data.picture === 'string' && data.picture.length > 0
            ? data.picture
            : undefined,
      };
    } catch (error) {
      this.logger.debug(
        `Auth0 /userinfo request failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return null;
    }
  }
}
