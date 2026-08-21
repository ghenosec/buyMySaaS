/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationStateService } from '../saas/publication-state.service';
import { AdminService } from './admin.service';

type TransactionClient = {
  user: {
    count: jest.Mock;
    update: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

describe('AdminService permissions', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: TransactionClient;

  beforeEach(() => {
    tx = {
      user: {
        count: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(
        (callback: (client: TransactionClient) => unknown) => callback(tx),
      ),
    };
    service = new AdminService(
      prisma as unknown as PrismaService,
      {} as PublicationStateService,
    );
  });

  it('lists users without selecting password hashes', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await service.users();

    const call = prisma.user.findMany.mock.calls.at(0);
    const args = call?.[0] as { select?: { passwordHash?: boolean } };
    expect(args.select?.passwordHash).toBeUndefined();
  });

  it('promotes a regular user to admin and creates an audit log', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      name: 'Maker',
      email: 'maker@example.com',
      role: UserRole.USER,
    });
    tx.user.update.mockResolvedValue({
      id: 'user-2',
      name: 'Maker',
      email: 'maker@example.com',
      role: UserRole.ADMIN,
    });

    await expect(
      service.updateUserRole('admin-1', 'user-2', UserRole.ADMIN),
    ).resolves.toEqual(expect.objectContaining({ role: UserRole.ADMIN }));

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: UserRole.ADMIN } }),
    );
    const auditCall = tx.auditLog.create.mock.calls.at(0);
    const auditArgs = auditCall?.[0] as {
      data?: { action?: string; actorUserId?: string; entityId?: string };
    };
    expect(auditArgs.data).toMatchObject({
      action: 'USER_ROLE_UPDATED',
      actorUserId: 'admin-1',
      entityId: 'user-2',
    });
  });

  it('blocks admins from demoting themselves', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    await expect(
      service.updateUserRole('admin-1', 'admin-1', UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks demoting the last active admin', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-2',
      name: 'Admin 2',
      email: 'admin2@example.com',
      role: UserRole.ADMIN,
    });
    tx.user.count.mockResolvedValue(1);

    await expect(
      service.updateUserRole('admin-1', 'admin-2', UserRole.USER),
    ).rejects.toThrow(BadRequestException);
  });
});
