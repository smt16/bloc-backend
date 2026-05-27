import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { Auth0JwtPayload } from '../auth0.types';

/**
 * Verifies Auth0-issued RS256 access tokens against the tenant's JWKS endpoint.
 *
 * The HTTP `JwtStrategy` uses `jwks-rsa`'s passport-jwt integration directly
 * (see `strategies/jwt.strategy.ts`). This service exists for code paths that
 * need to verify a raw token outside of an HTTP request — most notably the
 * WebSocket gateway during the handshake.
 */
@Injectable()
export class Auth0TokenService {
  private readonly logger = new Logger(Auth0TokenService.name);
  private readonly issuer: string;
  private readonly audience: string;
  private readonly client: JwksClient;

  constructor(configService: ConfigService) {
    const domain = configService.getOrThrow<string>('auth0.domain');
    const audience = configService.getOrThrow<string>('auth0.audience');
    const cacheTtlMs =
      configService.get<number>('auth0.jwksCacheTtlMs') ?? 600_000;

    this.issuer = `https://${domain}/`;
    this.audience = audience;
    this.client = jwksClient({
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: cacheTtlMs,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      timeout: 5_000,
    });
  }

  /**
   * Verifies signature, expiration, audience, and issuer. Returns the decoded
   * payload on success. Throws `UnauthorizedException` on any failure.
   */
  async verify(token: string): Promise<Auth0JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          if (!header.kid) {
            callback(new Error('Missing kid in token header'));
            return;
          }
          this.client.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
              callback(err ?? new Error('Signing key not found'));
              return;
            }
            callback(null, key.getPublicKey());
          });
        },
        {
          audience: this.audience,
          issuer: this.issuer,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err || !decoded || typeof decoded === 'string') {
            this.logger.debug(`Token verification failed: ${err?.message}`);
            reject(new UnauthorizedException('Invalid token'));
            return;
          }
          resolve(decoded as Auth0JwtPayload);
        },
      );
    });
  }
}
