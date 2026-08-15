import { Module } from '@nestjs/common';
import { DealRulesService } from './deal-rules.service';
import { EngagementsController } from './engagements.controller';
import { EngagementsService } from './engagements.service';

@Module({
  controllers: [EngagementsController],
  providers: [EngagementsService, DealRulesService],
})
export class EngagementsModule {}
