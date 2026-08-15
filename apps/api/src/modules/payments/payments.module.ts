import { Module } from '@nestjs/common';
import { SaasModule } from '../saas/saas.module';
import { MercadoPagoPaymentProvider } from './mercado-pago.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [SaasModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentProvider, MercadoPagoPaymentProvider],
})
export class PaymentsModule {}
