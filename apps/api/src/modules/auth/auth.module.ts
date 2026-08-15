import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../../common/admin.guard';
import { AuthGuard } from '../../common/auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AdminGuard],
  exports: [JwtModule, AuthGuard, AdminGuard],
})
export class AuthModule {}
