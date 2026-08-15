import { Module } from '@nestjs/common';
import { SaasModule } from '../saas/saas.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [SaasModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
