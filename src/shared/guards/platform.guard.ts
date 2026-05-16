import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthContext } from '../../interfaces/auth-context.interface';

@Injectable()
export class PlatformGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthContext = request.user;

    if (!user || user.actorType !== 'platform_user') {
      throw new ForbiddenException('This endpoint is restricted to Platform Administrators only');
    }

    return true;
  }
}
