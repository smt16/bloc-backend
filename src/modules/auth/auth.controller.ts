import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RevokeTokenDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.authService.getStatus();
  }

  /**
   * Email/password login via Auth0 Resource Owner Password (password-realm).
   * Proxied here so the native client never holds a client secret.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  /**
   * Creates a Database Connection user in Auth0, then returns tokens.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  /**
   * Refresh tokens issued by the confidential password-grant client.
   * Social (PKCE) sessions refresh directly against Auth0 from the device.
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: seconds(60) } })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  /**
   * Revokes a password-flow refresh token using the confidential client.
   * Always 204 — logout must succeed locally even if Auth0 is unreachable.
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: seconds(60) } })
  @Post('revoke')
  @HttpCode(204)
  async revoke(@Body() body: RevokeTokenDto): Promise<void> {
    try {
      await this.authService.revoke(body.refreshToken);
    } catch {
      // Best-effort: never block client logout.
    }
  }

  /**
   * Triggers Auth0's change-password email. Always returns 204 on success
   * so we don't leak whether the email exists.
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: seconds(60) } })
  @Post('forgot-password')
  @HttpCode(204)
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<void> {
    try {
      await this.authService.requestPasswordReset(body.email);
    } catch {
      // Swallow errors to avoid email enumeration — Auth0 also sends email
      // only when the user exists.
    }
  }

  /**
   * Returns the authenticated user (derived from the Auth0 access token).
   * Protected by the global `JwtAuthGuard`.
   */
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
      roles: user.roles,
      permissions: user.permissions,
      scopes: user.scopes,
    };
  }
}
