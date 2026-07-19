import { Injectable } from '@nestjs/common';
import {
  Auth0PasswordService,
  type Auth0TokenResponse,
} from './services/auth0-password.service';

@Injectable()
export class AuthService {
  constructor(private readonly passwordAuth: Auth0PasswordService) {}

  getStatus(): { status: string; passwordLogin: boolean } {
    return {
      status: 'ok',
      passwordLogin: this.passwordAuth.isConfigured(),
    };
  }

  login(email: string, password: string): Promise<Auth0TokenResponse> {
    return this.passwordAuth.login(email, password);
  }

  register(email: string, password: string): Promise<Auth0TokenResponse> {
    return this.passwordAuth.register(email, password);
  }

  requestPasswordReset(email: string): Promise<void> {
    return this.passwordAuth.requestPasswordReset(email);
  }

  refresh(refreshToken: string): Promise<Auth0TokenResponse> {
    return this.passwordAuth.refresh(refreshToken);
  }

  revoke(refreshToken: string): Promise<void> {
    return this.passwordAuth.revoke(refreshToken);
  }
}
