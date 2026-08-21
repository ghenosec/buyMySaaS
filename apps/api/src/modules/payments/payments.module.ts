import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { SaasModule } from '../saas/saas.module';
import { MercadoPagoPaymentProvider } from './mercado-pago.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [SaasModule, ModerationModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentProvider, MercadoPagoPaymentProvider],
})
export class PaymentsModule {}
