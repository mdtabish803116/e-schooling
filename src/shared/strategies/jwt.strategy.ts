import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Config } from '../../config/index';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { Student } from '../../models/entities/student/student.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  actorType: 'school_owner' | 'school_user' | 'student' | 'platform_user';
  schoolId?: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dataSource: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Config.getSecret('JWT_SECRET', String) || 'default_secret_please_change_in_production',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthContext> {
    // 1. Check School Status if applicable
    if (payload.schoolId) {
      const school = await this.dataSource.getRepository(School).findOne({
        where: { id: payload.schoolId }
      });
      if (!school || !school.isActive || school.isDeleted) {
        throw new UnauthorizedException('Your school is deactivated, blocked or deleted');
      }
    }

    // 2. Check Actor Status
    if (payload.actorType === 'school_owner') {
      const owner = await this.dataSource.getRepository(SchoolOwner).findOne({ where: { id: payload.sub } });
      if (!owner || !owner.isActive) throw new UnauthorizedException('Your account is deactivated');
    } else if (payload.actorType === 'school_user') {
      const user = await this.dataSource.getRepository(SchoolUser).findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive || user.isDeleted) throw new UnauthorizedException('Your account is deactivated');
    } else if (payload.actorType === 'student') {
      const student = await this.dataSource.getRepository(Student).findOne({ where: { id: payload.sub } });
      if (!student || !student.isActive || student.isDeleted) throw new UnauthorizedException('Your account is deactivated');
    } else if (payload.actorType === 'platform_user') {
      const pUser = await this.dataSource.getRepository(PlatformUser).findOne({ where: { id: payload.sub } });
      if (!pUser || !pUser.isActive || pUser.isDeleted) throw new UnauthorizedException('Your account is deactivated');
    }

    return {
      id: payload.sub,
      email: payload.email,
      actorType: payload.actorType,
      schoolId: payload.schoolId,
      roles: payload.roles,
    };
  }
}
