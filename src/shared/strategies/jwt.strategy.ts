import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Config } from '../../config/index';
import { AuthContext } from '../../interfaces/auth-context.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  actorType: 'school_owner' | 'school_user';
  schoolId?: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Config.getSecret('JWT_SECRET', String) || 'default_secret_please_change_in_production',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthContext> {
    return {
      id: payload.sub,
      email: payload.email,
      actorType: payload.actorType,
      schoolId: payload.schoolId,
      role: payload.role,
    };
  }
}
