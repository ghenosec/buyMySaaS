import { ForbiddenException, NotFoundException } from '@nestjs/common';

export function assertOwnership(
  resource: { ownerId: string } | null,
  userId: string,
): asserts resource {
  if (!resource) throw new NotFoundException('SaaS não encontrado');
  if (resource.ownerId !== userId)
    throw new ForbiddenException('Você não pode alterar este SaaS');
}
