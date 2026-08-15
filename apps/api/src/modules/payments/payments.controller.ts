import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth-user';
import { CurrentUser } from '../../common/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post('me/saas/:id/submit') @UseGuards(AuthGuard) submit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.payments.submit(user.id, id);
  }
  @Post('me/saas/:id/publication-checkout') @UseGuards(AuthGuard) checkout(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.payments.submit(user.id, id);
  }
  @Post('payments/mock/:orderId/confirm') @UseGuards(AuthGuard) confirm(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.confirmMock(user.id, orderId);
  }
  @Post('webhooks/mercado-pago') @HttpCode(200) webhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: { id?: string; data?: { id?: string }; action?: string },
  ) {
    const dataId = String(body.data?.id ?? body.id ?? '');
    const eventId = String(body.id ?? `${body.action ?? 'event'}:${dataId}`);
    return this.payments.webhook(headers, dataId, eventId);
  }
}
