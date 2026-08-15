import { BadRequestException } from '@nestjs/common';
import { DealRulesService } from './deal-rules.service';
describe('DealRulesService', () => {
  const service = new DealRulesService();
  it('aceita desconto coerente', () =>
    expect(() =>
      service.validate({
        type: 'DISCOUNT',
        startsAt: new Date('2026-01-01'),
        endsAt: new Date('2026-02-01'),
        originalPriceCents: 10000,
        promotionalPriceCents: 5000,
      }),
    ).not.toThrow());
  it('bloqueia preço promocional maior', () =>
    expect(() =>
      service.validate({
        type: 'DISCOUNT',
        startsAt: new Date('2026-01-01'),
        originalPriceCents: 5000,
        promotionalPriceCents: 6000,
      }),
    ).toThrow(BadRequestException));
  it('exige código em deal de cupom', () =>
    expect(() =>
      service.validate({ type: 'COUPON', startsAt: new Date() }),
    ).toThrow(BadRequestException));
});
