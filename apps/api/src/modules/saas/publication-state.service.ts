import { BadRequestException, Injectable } from '@nestjs/common';
import { SaasStatus } from '../../generated/prisma/client';

@Injectable()
export class PublicationStateService {
  assertCanSubmit(status: SaasStatus) {
    if (!['DRAFT', 'REJECTED'].includes(status))
      throw new BadRequestException(
        'Este SaaS não pode ser enviado neste estado',
      );
  }
  afterSubmission(feeEnabled: boolean): SaasStatus {
    return feeEnabled ? 'PENDING_PAYMENT' : 'PENDING_REVIEW';
  }
  assertCanModerate(status: SaasStatus) {
    if (status !== 'PENDING_REVIEW')
      throw new BadRequestException(
        'Somente submissões pendentes podem ser moderadas',
      );
  }
}
