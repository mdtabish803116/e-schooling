import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LoginHistoryController } from './login-history.controller';
import { AuthService } from '../../../../services/auth/auth.service';
import { JwtStrategy } from '../../../../shared/strategies/jwt.strategy';
import { Config } from '../../../../config/index';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret:
          Config.getSecret('JWT_SECRET', String) ||
          'default_secret_please_change_in_production',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController, LoginHistoryController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
