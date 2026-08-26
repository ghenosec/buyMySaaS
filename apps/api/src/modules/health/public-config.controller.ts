import { Controller, Get } from '@nestjs/common';
@Controller('config')
export class PublicConfigController {
  @Get('public') get() {
    return {
      reviewsEnabled: process.env.REVIEWS_ENABLED !== 'false',
    };
  }
}
