import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { Auth0TokenService } from './services/auth0-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([AuthSessionEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, Auth0TokenService],
  exports: [PassportModule, Auth0TokenService],
})
export class AuthModule {}
