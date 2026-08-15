import { BadRequestException, Injectable } from '@nestjs/common';
import { DealDto } from './engagements.dto';

@Injectable()
export class DealRulesService {
  validate(dto: DealDto) {
    if (dto.endsAt && dto.endsAt <= dto.startsAt)
      throw new BadRequestException(
        'O encerramento deve ocorrer após o início',
      );
    if (dto.type === 'COUPON' && !dto.couponCode)
      throw new BadRequestException('Informe o cupom');
    if (
      dto.type !== 'COUPON' &&
      dto.promotionalPriceCents === undefined &&
      dto.discountPercent === undefined
    )
      throw new BadRequestException('Informe preço promocional ou desconto');
    if (
      dto.originalPriceCents !== undefined &&
      dto.promotionalPriceCents !== undefined &&
      dto.promotionalPriceCents >= dto.originalPriceCents
    )
      throw new BadRequestException('O preço promocional deve ser menor');
  }
}
