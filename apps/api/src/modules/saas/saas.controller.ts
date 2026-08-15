import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth-user';
import { CurrentUser } from '../../common/current-user.decorator';
import { CreateSaasDto, ExploreQueryDto, UpdateSaasDto } from './saas.dto';
import { SaasService } from './saas.service';

@Controller()
export class SaasController {
  constructor(private readonly saas: SaasService) {}
  @Get('saas') list(@Query() query: ExploreQueryDto) {
    return this.saas.listPublic(query);
  }
  @Get('saas/trending') trending() {
    return this.saas.listPublic(
      Object.assign(new ExploreQueryDto(), { sort: 'trending', pageSize: 8 }),
    );
  }
  @Get('saas/recent') recent() {
    return this.saas.listPublic(
      Object.assign(new ExploreQueryDto(), { sort: 'recent', pageSize: 8 }),
    );
  }
  @Get('saas/:slug') get(@Param('slug') slug: string) {
    return this.saas.getPublic(slug);
  }
  @Get('me/saas') @UseGuards(AuthGuard) mine(@CurrentUser() user: AuthUser) {
    return this.saas.mine(user.id);
  }
  @Post('me/saas') @UseGuards(AuthGuard) create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSaasDto,
  ) {
    return this.saas.create(user.id, dto);
  }
  @Get('me/saas/:id') @UseGuards(AuthGuard) mineOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.saas.mineOne(user.id, id);
  }
  @Patch('me/saas/:id') @UseGuards(AuthGuard) update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSaasDto,
  ) {
    return this.saas.update(user.id, id, dto);
  }
  @Delete('me/saas/:id') @UseGuards(AuthGuard) archive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.saas.archive(user.id, id);
  }
}
