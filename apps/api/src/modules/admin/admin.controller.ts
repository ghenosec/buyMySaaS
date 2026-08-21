import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../common/admin.guard';
import { AuthGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth-user';
import { CurrentUser } from '../../common/current-user.decorator';
import { RejectSubmissionDto, UpdateUserRoleDto } from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get() dashboard() {
    return this.admin.dashboard();
  }
  @Get('submissions') list(@Query('page') page?: string) {
    return this.admin.submissions(Number(page ?? 1));
  }
  @Get('submissions/:id') get(@Param('id') id: string) {
    return this.admin.submission(id);
  }
  @Get('users') users(@Query('search') search?: string) {
    return this.admin.users(search);
  }
  @Patch('users/:id/role') updateUserRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.admin.updateUserRole(user.id, id, dto.role);
  }
  @Post('submissions/:id/approve') approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.admin.approve(user.id, id);
  }
  @Post('submissions/:id/reject') reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectSubmissionDto,
  ) {
    return this.admin.reject(user.id, id, dto.reason);
  }
  @Delete('saas/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.remove(user.id, id);
  }
}
