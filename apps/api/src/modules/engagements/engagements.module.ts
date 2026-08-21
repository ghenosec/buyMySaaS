import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { EngagementsController } from './engagements.controller';
import { EngagementsService } from './engagements.service';

@Module({
  imports: [ModerationModule],
  controllers: [EngagementsController],
  providers: [EngagementsService],
})
export class EngagementsModule {}
