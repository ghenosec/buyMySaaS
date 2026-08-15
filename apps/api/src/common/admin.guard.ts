import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from './auth-user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user: AuthUser }>().user;
    if (user.role !== 'ADMIN')
      throw new ForbiddenException('Acesso exclusivo para administradores');
    return true;
  }
}
