import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Request } from 'express';

import { USER_ROLES } from '../../common/constants/enums';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user as any;

    if (!user || user.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
