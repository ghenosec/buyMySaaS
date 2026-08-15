import { Module } from '@nestjs/common';
import { PublicationStateService } from './publication-state.service';
import { SaasController } from './saas.controller';
import { SaasService } from './saas.service';
import { TrendingService } from './trending.service';

@Module({
  controllers: [SaasController],
  providers: [SaasService, TrendingService, PublicationStateService],
  exports: [SaasService, TrendingService, PublicationStateService],
})
export class SaasModule {}
