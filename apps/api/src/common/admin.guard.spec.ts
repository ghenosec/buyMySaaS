import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AdminGuard } from './admin.guard';
import { AuthUser } from './auth-user';

describe('AdminGuard', () => {
  function context(user: AuthUser): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  }

  function guardWithRole(role: UserRole | null) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(role ? { role } : null),
      },
    };
    return {
      guard: new AdminGuard(prisma as unknown as PrismaService),
      prisma,
    };
  }

  it('allows access when the current database role is ADMIN', async () => {
    const tokenUser: AuthUser = {
      id: 'user-1',
      email: 'admin@example.com',
      role: UserRole.USER,
    };
    const { guard } = guardWithRole(UserRole.ADMIN);

    await expect(guard.canActivate(context(tokenUser))).resolves.toBe(true);
    expect(tokenUser.role).toBe(UserRole.ADMIN);
  });

  it('blocks access when a stale token still says ADMIN but database role is USER', async () => {
    const tokenUser: AuthUser = {
      id: 'user-1',
      email: 'former-admin@example.com',
      role: UserRole.ADMIN,
    };
    const { guard } = guardWithRole(UserRole.USER);

    await expect(guard.canActivate(context(tokenUser))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
