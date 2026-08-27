import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { StorageModule } from '../storage/storage.module';
import { PublicationStateService } from './publication-state.service';
import { SaasController } from './saas.controller';
import { SaasService } from './saas.service';
import { TrendingService } from './trending.service';

@Module({
  imports: [ModerationModule, StorageModule],
  controllers: [SaasController],
  providers: [SaasService, TrendingService, PublicationStateService],
  exports: [SaasService, TrendingService, PublicationStateService],
})
export class SaasModule {}
