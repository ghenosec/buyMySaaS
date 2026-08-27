import { Module } from '@nestjs/common';
import { SaasModule } from '../saas/saas.module';
import { StorageModule } from '../storage/storage.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [SaasModule, StorageModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
