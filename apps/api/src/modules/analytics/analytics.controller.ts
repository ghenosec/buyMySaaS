import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsEventType } from '../../generated/prisma/client';
import { Request, Response } from 'express';
import { AuthGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth-user';
import { CurrentUser } from '../../common/current-user.decorator';
import { AnalyticsEventDto } from './analytics.dto';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @Post('analytics/event') async record(
    @Body() dto: AnalyticsEventDto,
    @Req() req: Request,
  ) {
    await this.analytics.record(dto.saasId, dto.type, dto.referrer, req.ip);
    return { accepted: true };
  }
  @Get('saas/:slug/out') async out(
    @Param('slug') slug: string,
    @Query('type') type: AnalyticsEventType,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const target = await this.analytics.resolveRedirect(
      slug,
      type,
      req.get('referer'),
      req.ip,
    );
    return res.redirect(302, target);
  }
  @Get('me/saas/:id/analytics') @UseGuards(AuthGuard) detail(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.analytics.ownerAnalytics(user.id, id, Number(days ?? 30));
  }
  @Get('me/dashboard') @UseGuards(AuthGuard) dashboard(
    @CurrentUser() user: AuthUser,
  ) {
    return this.analytics.dashboard(user.id);
  }
}
