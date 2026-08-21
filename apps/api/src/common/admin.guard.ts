import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuthUser } from './auth-user';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest<{ user: AuthUser }>().user;
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (currentUser?.role !== UserRole.ADMIN)
      throw new ForbiddenException('Acesso exclusivo para administradores');
    user.role = currentUser.role;
    return true;
  }
}
