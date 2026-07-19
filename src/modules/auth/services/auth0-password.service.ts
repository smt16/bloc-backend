import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type Auth0TokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresIn: number | null;
  tokenType: string;
};

type Auth0ErrorBody = {
  error?: string;
  error_description?: string;
  message?: string;
  statusCode?: number;
};

/**
 * Proxies Auth0 Database Connection Authentication API calls so the mobile
 * client can offer a native email/password UI without embedding a client secret
 * or using the (public-client) Resource Owner Password Grant directly.
 *
 * Requires a confidential Auth0 application with the Password grant enabled,
 * plus AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET on the API.
 */
@Injectable()
export class Auth0PasswordService {
  private readonly logger = new Logger(Auth0PasswordService.name);
  private readonly domain: string;
  private readonly audience: string;
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly connection: string;
  private readonly scope: string;

  constructor(configService: ConfigService) {
    this.domain = configService.getOrThrow<string>('auth0.domain');
    this.audience = configService.getOrThrow<string>('auth0.audience');
    this.clientId = configService.get<string | undefined>('auth0.clientId');
    this.clientSecret = configService.get<string | undefined>(
      'auth0.clientSecret',
    );
    this.connection =
      configService.get<string>('auth0.dbConnection') ??
      'Username-Password-Authentication';
    this.scope =
      configService.get<string>('auth0.passwordGrantScope') ??
      'openid profile email offline_access';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async login(email: string, password: string): Promise<Auth0TokenResponse> {
    this.assertConfigured();

    const body = new URLSearchParams({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      username: email,
      password,
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
      realm: this.connection,
      audience: this.audience,
      scope: this.scope,
    });

    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!response.ok) {
      throw this.mapTokenError(response.status, payload, 'login');
    }

    return this.toTokenResponse(payload);
  }

  async register(email: string, password: string): Promise<Auth0TokenResponse> {
    this.assertConfigured();

    const response = await fetch(
      `https://${this.domain}/dbconnections/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          email,
          password,
          connection: this.connection,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    const payload = (await response
      .json()
      .catch(() => null)) as Auth0ErrorBody | null;

    if (!response.ok) {
      throw this.mapSignupError(response.status, payload);
    }

    // Signup only creates the user — exchange credentials for tokens.
    return this.login(email, password);
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.assertConfigured();

    const response = await fetch(
      `https://${this.domain}/dbconnections/change_password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          email,
          connection: this.connection,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    // Auth0 returns plain text on success; only treat hard failures as errors.
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.warn(
        `Auth0 change_password failed (${response.status}): ${text || 'unknown'}`,
      );
      throw new BadRequestException(
        'Could not start password reset. Check the email and try again.',
      );
    }
  }

  async refresh(refreshToken: string): Promise<Auth0TokenResponse> {
    this.assertConfigured();

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
      refresh_token: refreshToken,
    });

    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!response.ok) {
      throw this.mapTokenError(response.status, payload, 'refresh');
    }

    const tokens = this.toTokenResponse(payload);
    // When refresh-token rotation is off, Auth0 omits refresh_token — keep the
    // one the client sent so the session is not wiped after the first refresh.
    if (!tokens.refreshToken) {
      tokens.refreshToken = refreshToken;
    }
    return tokens;
  }

  /**
   * Revokes a refresh token issued by the confidential password-grant client.
   * Uses Auth0's /oauth/revoke endpoint.
   */
  async revoke(refreshToken: string): Promise<void> {
    this.assertConfigured();

    const body = new URLSearchParams({
      token: refreshToken,
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
    });

    const response = await fetch(`https://${this.domain}/oauth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.warn(
        `Auth0 /oauth/revoke failed (${response.status}): ${text || 'unknown'}`,
      );
      throw new BadRequestException('Could not revoke refresh token.');
    }
  }

  private assertConfigured(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new ServiceUnavailableException(
        'Email/password login is not configured. Set AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET.',
      );
    }
  }

  private toTokenResponse(
    payload: Record<string, unknown> | null,
  ): Auth0TokenResponse {
    if (!payload || typeof payload.access_token !== 'string') {
      throw new UnauthorizedException('Auth0 did not return an access token.');
    }

    return {
      accessToken: payload.access_token,
      refreshToken:
        typeof payload.refresh_token === 'string'
          ? payload.refresh_token
          : null,
      idToken: typeof payload.id_token === 'string' ? payload.id_token : null,
      expiresIn:
        typeof payload.expires_in === 'number' ? payload.expires_in : null,
      tokenType:
        typeof payload.token_type === 'string' ? payload.token_type : 'Bearer',
    };
  }

  private mapTokenError(
    status: number,
    payload: Auth0ErrorBody | null,
    context: 'login' | 'refresh' = 'login',
  ): Error {
    const description =
      payload?.error_description ?? payload?.message ?? 'Authentication failed';
    const code = payload?.error;
    const lower = description.toLowerCase();

    // Always surface Auth0's reason in logs — never leak raw text to clients.
    this.logger.warn(
      `Auth0 /oauth/token failed (${status}) [${code ?? 'unknown'}]: ${description}`,
    );

    // Misconfiguration — do NOT pretend these are bad credentials.
    if (
      code === 'unauthorized_client' ||
      code === 'invalid_client' ||
      code === 'unsupported_grant_type' ||
      lower.includes('grant type') ||
      lower.includes('not allowed for the client') ||
      lower.includes('client is not authorized')
    ) {
      return new ServiceUnavailableException(
        'Email/password login is temporarily unavailable. Try again later.',
      );
    }

    if (code === 'too_many_attempts') {
      return new BadRequestException(
        'Too many failed attempts. Try again later.',
      );
    }

    // Wrong email/password (or user blocked / unverified in some tenants).
    if (
      code === 'invalid_grant' ||
      code === 'access_denied' ||
      code === 'invalid_user_password' ||
      lower.includes('wrong email or password') ||
      lower.includes('wrong email or verification')
    ) {
      if (context === 'refresh') {
        return new UnauthorizedException(
          'Session expired. Please sign in again.',
        );
      }
      return new UnauthorizedException('Invalid email or password.');
    }

    if (status === 401 || status === 403) {
      if (context === 'refresh') {
        return new UnauthorizedException(
          'Session expired. Please sign in again.',
        );
      }
      return new UnauthorizedException('Invalid email or password.');
    }

    return new BadRequestException('Authentication failed. Please try again.');
  }

  private mapSignupError(
    status: number,
    payload: Auth0ErrorBody | null,
  ): Error {
    const description =
      payload?.error_description ?? payload?.message ?? 'Signup failed';
    const code = payload?.error ?? payload?.message;

    this.logger.warn(
      `Auth0 /dbconnections/signup failed (${status}) [${
        typeof code === 'string' ? code : 'unknown'
      }]: ${description}`,
    );

    if (
      status === 400 &&
      typeof code === 'string' &&
      (code.includes('already exists') ||
        description.toLowerCase().includes('already'))
    ) {
      return new ConflictException(
        'An account with that email already exists.',
      );
    }

    if (status === 400) {
      return new BadRequestException(description);
    }

    return new BadRequestException(description);
  }
}
