import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { assertOwnership } from './ownership';
describe('assertOwnership', () => {
  it('aceita o owner', () =>
    expect(() =>
      assertOwnership({ ownerId: 'user-1' }, 'user-1'),
    ).not.toThrow());
  it('rejeita outro usuário', () =>
    expect(() => assertOwnership({ ownerId: 'user-1' }, 'user-2')).toThrow(
      ForbiddenException,
    ));
  it('não revela recurso ausente', () =>
    expect(() => assertOwnership(null, 'user-1')).toThrow(NotFoundException));
});
