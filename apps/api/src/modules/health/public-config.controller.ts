import { Controller, Get } from '@nestjs/common';
@Controller('config')
export class PublicConfigController {
  @Get('public') get() {
    return {
      publicationFeeEnabled: process.env.PUBLICATION_FEE_ENABLED !== 'false',
      publicationFeeCents: Number(process.env.PUBLICATION_FEE_CENTS ?? 990),
      publicationFeeCurrency: process.env.PUBLICATION_FEE_CURRENCY ?? 'BRL',
      reviewsEnabled: process.env.REVIEWS_ENABLED !== 'false',
      dealsEnabled: process.env.DEALS_ENABLED !== 'false',
    };
  }
}
