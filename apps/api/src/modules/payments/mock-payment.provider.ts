import { Injectable } from '@nestjs/common';
import {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  PaymentState,
} from './payment-provider';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'MOCK' as const;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return Promise.resolve({
      providerPaymentId: `mock_${input.orderId}`,
      checkoutUrl: `${process.env.WEB_URL}/dashboard/saas/${input.saasId}/review?order=${input.orderId}`,
    });
  }
  getPayment(id: string): Promise<PaymentState> {
    return Promise.resolve({ id, paid: true, status: 'approved' });
  }
  verifyWebhook(): boolean {
    return true;
  }
}
