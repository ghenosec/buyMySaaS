import { BadRequestException } from '@nestjs/common';
import { PublicationStateService } from './publication-state.service';
describe('PublicationStateService', () => {
  const service = new PublicationStateService();
  it('encaminha toda submissão direto para revisão', () =>
    expect(service.afterSubmission()).toBe('PENDING_REVIEW'));
  it('bloqueia reenvio em estado inválido', () =>
    expect(() => service.assertCanSubmit('PUBLISHED')).toThrow(
      BadRequestException,
    ));
});
