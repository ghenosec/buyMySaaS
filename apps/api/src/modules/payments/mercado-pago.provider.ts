import { BadGatewayException, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  PaymentState,
} from './payment-provider';

@Injectable()
export class MercadoPagoPaymentProvider implements PaymentProvider {
  readonly name = 'MERCADO_PAGO' as const;
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': input.orderId,
        },
        body: JSON.stringify({
          external_reference: input.orderId,
          items: [
            {
              id: input.saasId,
              title: `Publicação: ${input.title}`,
              quantity: 1,
              currency_id: input.currency,
              unit_price: input.amountCents / 100,
            },
          ],
          back_urls: {
            success: `${process.env.WEB_URL}/dashboard?payment=success`,
            pending: `${process.env.WEB_URL}/dashboard?payment=pending`,
            failure: `${process.env.WEB_URL}/dashboard?payment=failure`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.API_URL}/api/v1/webhooks/mercado-pago`,
        }),
      },
    );
    if (!response.ok)
      throw new BadGatewayException('Não foi possível criar o checkout');
    const body = (await response.json()) as { id: string; init_point: string };
    return { providerPaymentId: body.id, checkoutUrl: body.init_point };
  }
  async getPayment(id: string): Promise<PaymentState> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      },
    );
    if (!response.ok)
      throw new BadGatewayException('Pagamento não encontrado no provedor');
    const body = (await response.json()) as {
      id: number;
      status: string;
      external_reference?: string;
    };
    return {
      id: String(body.id),
      status: body.status,
      paid: body.status === 'approved',
      externalReference: body.external_reference,
    };
  }
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    dataId: string,
  ): boolean {
    const signature = String(headers['x-signature'] ?? '');
    const requestId = String(headers['x-request-id'] ?? '');
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (!signature || !requestId || !secret) return false;
    const parts = Object.fromEntries(
      signature.split(',').map((part) => part.trim().split('=', 2)),
    ) as Record<string, string>;
    if (!parts.ts || !parts.v1) return false;
    const expected = createHmac('sha256', secret)
      .update(`id:${dataId};request-id:${requestId};ts:${parts.ts};`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(parts.v1);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
