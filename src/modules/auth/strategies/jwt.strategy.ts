import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { mapAuth0Payload } from '../auth0-user.mapper';
import { Auth0JwtPayload, AuthenticatedUser } from '../auth0.types';

/**
 * Validates Auth0-issued RS256 access tokens for HTTP requests.
 *
 * Signature verification uses `jwks-rsa` against the tenant's JWKS endpoint,
 * with audience + issuer checks per the Auth0 best-practice guide:
 *   https://auth0.com/docs/secure/tokens/json-web-tokens/validate-json-web-tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly namespace: string;

  constructor(configService: ConfigService) {
    const domain = configService.getOrThrow<string>('auth0.domain');
    const audience = configService.getOrThrow<string>('auth0.audience');
    const cacheTtlMs =
      configService.get<number>('auth0.jwksCacheTtlMs') ?? 600_000;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      ignoreExpiration: false,
      audience,
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        cacheMaxAge: cacheTtlMs,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
    });

    this.namespace = configService.getOrThrow<string>('auth0.namespace');
  }

  validate(req: Request, payload: Auth0JwtPayload): AuthenticatedUser {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    return {
      ...mapAuth0Payload(payload, this.namespace),
      accessToken: accessToken ?? undefined,
    };
  }
}
