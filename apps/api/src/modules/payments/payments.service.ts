import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { assertOwnership } from '../../common/ownership';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { PublicationStateService } from '../saas/publication-state.service';
import { MercadoPagoPaymentProvider } from './mercado-pago.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentProvider } from './payment-provider';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly states: PublicationStateService,
    private readonly moderation: ModerationService,
    private readonly mock: MockPaymentProvider,
    private readonly mercadoPago: MercadoPagoPaymentProvider,
  ) {}
  private provider(): PaymentProvider {
    if (process.env.PAYMENT_PROVIDER === 'mercado_pago') {
      if (!process.env.MERCADO_PAGO_ACCESS_TOKEN)
        throw new ServiceUnavailableException(
          'Provedor de pagamento não configurado',
        );
      return this.mercadoPago;
    }
    if (process.env.NODE_ENV === 'production')
      throw new ServiceUnavailableException(
        'Pagamento mock não é permitido em produção',
      );
    return this.mock;
  }
  async submit(userId: string, saasId: string) {
    const saas = await this.prisma.saas.findUnique({ where: { id: saasId } });
    assertOwnership(saas, userId);
    this.moderation.assertAllowed([
      saas.name,
      saas.slug,
      saas.tagline,
      saas.shortDescription,
      saas.description,
      saas.websiteUrl,
      saas.trialUrl,
      saas.checkoutUrl,
      saas.docsUrl,
      saas.demoUrl,
      saas.pricingLabel,
      saas.tags,
      saas.technologies,
    ]);
    this.states.assertCanSubmit(saas.status);
    const feeEnabled = process.env.PUBLICATION_FEE_ENABLED !== 'false';
    if (!feeEnabled) {
      await this.prisma.saas.update({
        where: { id: saasId },
        data: { status: 'PENDING_REVIEW', rejectionReason: null },
      });
      return { requiresPayment: false, status: 'PENDING_REVIEW' };
    }
    const amountCents = Number(process.env.PUBLICATION_FEE_CENTS ?? 990);
    const currency = process.env.PUBLICATION_FEE_CURRENCY ?? 'BRL';
    const provider = this.provider();
    const order = await this.prisma.publicationOrder.create({
      data: {
        userId,
        saasId,
        provider: provider.name,
        amountCents,
        currency,
        status: 'PENDING',
      },
    });
    const checkout = await provider.createCheckout({
      orderId: order.id,
      saasId,
      title: saas.name,
      amountCents,
      currency,
    });
    await this.prisma.$transaction([
      this.prisma.saas.update({
        where: { id: saasId },
        data: { status: 'PENDING_PAYMENT', rejectionReason: null },
      }),
      this.prisma.publicationOrder.update({
        where: { id: order.id },
        data: {
          providerPaymentId: checkout.providerPaymentId,
          checkoutUrl: checkout.checkoutUrl,
        },
      }),
    ]);
    return {
      requiresPayment: true,
      orderId: order.id,
      checkoutUrl: checkout.checkoutUrl,
      amountCents,
      currency,
      provider: provider.name,
    };
  }
  async confirmMock(userId: string, orderId: string) {
    if (
      process.env.NODE_ENV === 'production' ||
      (process.env.PAYMENT_PROVIDER ?? 'mock') !== 'mock'
    )
      throw new ForbiddenException('Pagamento mock não está disponível');
    const order = await this.prisma.publicationOrder.findUnique({
      where: { id: orderId },
      include: { saas: true },
    });
    if (!order) throw new NotFoundException();
    assertOwnership(order.saas, userId);
    if (order.provider !== 'MOCK') throw new BadRequestException();
    return this.markPaid(
      order.id,
      order.saasId,
      order.providerPaymentId ?? `mock_${order.id}`,
      userId,
    );
  }
  async webhook(
    headers: Record<string, string | string[] | undefined>,
    dataId: string,
    eventId: string,
  ) {
    if (!this.mercadoPago.verifyWebhook(headers, dataId))
      throw new BadRequestException('Assinatura inválida');
    const duplicate = await this.prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });
    if (duplicate) return { received: true, duplicate: true };
    const payment = await this.mercadoPago.getPayment(dataId);
    try {
      await this.prisma.webhookEvent.create({
        data: { id: eventId, provider: 'MERCADO_PAGO' },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { received: true, duplicate: true };
      }
      throw error;
    }
    if (!payment.paid) return { received: true };
    const order = payment.externalReference
      ? await this.prisma.publicationOrder.findUnique({
          where: { id: payment.externalReference },
        })
      : await this.prisma.publicationOrder.findFirst({
          where: { providerPaymentId: dataId },
        });
    if (!order) return { received: true };
    await this.markPaid(order.id, order.saasId, payment.id);
    return { received: true };
  }
  private async markPaid(
    orderId: string,
    saasId: string,
    paymentId: string,
    actorUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.publicationOrder.findUniqueOrThrow({
        where: { id: orderId },
      });
      if (order.status === 'PAID') return order;
      const paid = await tx.publicationOrder.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          providerPaymentId: paymentId,
        },
      });
      await tx.saas.update({
        where: { id: saasId },
        data: { status: 'PENDING_REVIEW' },
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'PUBLICATION_PAYMENT_CONFIRMED',
          entityType: 'PublicationOrder',
          entityId: orderId,
          metadata: { provider: order.provider },
        },
      });
      return paid;
    });
  }
}
