import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.authService.getStatus();
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
