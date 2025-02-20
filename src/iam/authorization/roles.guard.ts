import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { REQUEST_USER_KEY } from 'src/iam/iam.constants';
import { ROLES_KEY } from './role.decorator';
import { AccessTokenData } from '../interfaces/access-token-data.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const user = request[REQUEST_USER_KEY] as AccessTokenData | undefined;
    return requiredRoles.some((role) => user?.role === role);
  }
}
