export type CheckoutInput = {
  orderId: string;
  saasId: string;
  title: string;
  amountCents: number;
  currency: string;
};
export type CheckoutResult = {
  providerPaymentId?: string;
  checkoutUrl: string;
};
export type PaymentState = {
  id: string;
  paid: boolean;
  status: string;
  externalReference?: string;
};

export interface PaymentProvider {
  readonly name: 'MOCK' | 'MERCADO_PAGO';
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  getPayment(id: string): Promise<PaymentState>;
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    dataId: string,
  ): boolean;
}
