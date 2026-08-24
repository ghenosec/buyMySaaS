import { Controller, Get } from '@nestjs/common';
@Controller('config')
export class PublicConfigController {
  @Get('public') get() {
    return {
      publicationFeeEnabled: process.env.PUBLICATION_FEE_ENABLED !== 'false',
      publicationFeeCents: Number(process.env.PUBLICATION_FEE_CENTS ?? 990),
      publicationFeeCurrency: process.env.PUBLICATION_FEE_CURRENCY ?? 'BRL',
      sponsoredPlacementEnabled:
        process.env.SPONSORED_PLACEMENT_ENABLED !== 'false',
      sponsoredPlacementPriceCents: Number(
        process.env.SPONSORED_PLACEMENT_PRICE_CENTS ?? 2990,
      ),
      sponsoredPlacementDurationDays: Number(
        process.env.SPONSORED_PLACEMENT_DURATION_DAYS ?? 7,
      ),
      sponsoredPlacementCurrency:
        process.env.SPONSORED_PLACEMENT_CURRENCY ??
        process.env.PUBLICATION_FEE_CURRENCY ??
        'BRL',
      reviewsEnabled: process.env.REVIEWS_ENABLED !== 'false',
    };
  }
}
