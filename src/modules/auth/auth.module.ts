import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { Auth0PasswordService } from './services/auth0-password.service';
import { Auth0TokenService } from './services/auth0-token.service';
import { Auth0UserInfoService } from './services/auth0-userinfo.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([AuthSessionEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    Auth0PasswordService,
    Auth0TokenService,
    Auth0UserInfoService,
  ],
  exports: [PassportModule, Auth0TokenService, Auth0UserInfoService],
})
export class AuthModule {}
