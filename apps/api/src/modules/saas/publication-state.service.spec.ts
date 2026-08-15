import { BadRequestException } from '@nestjs/common';
import { PublicationStateService } from './publication-state.service';
describe('PublicationStateService', () => {
  const service = new PublicationStateService();
  it('encaminha direto para revisão quando a taxa está desativada', () =>
    expect(service.afterSubmission(false)).toBe('PENDING_REVIEW'));
  it('exige pagamento quando a taxa está ativa', () =>
    expect(service.afterSubmission(true)).toBe('PENDING_PAYMENT'));
  it('bloqueia reenvio em estado inválido', () =>
    expect(() => service.assertCanSubmit('PUBLISHED')).toThrow(
      BadRequestException,
    ));
});
