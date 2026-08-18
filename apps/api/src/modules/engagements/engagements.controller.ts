import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth-user';
import { CurrentUser } from '../../common/current-user.decorator';
import { ReviewDto } from './engagements.dto';
import { EngagementsService } from './engagements.service';

@Controller()
export class EngagementsController {
  constructor(private readonly service: EngagementsService) {}
  @Get('saas/:id/reviews') reviews(@Param('id') id: string) {
    return this.service.listReviews(id);
  }
  @Post('saas/:id/reviews') @UseGuards(AuthGuard) review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.service.review(user.id, id, dto);
  }
  @Patch('reviews/:id') @UseGuards(AuthGuard) updateReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.service.updateReview(user.id, id, dto);
  }
  @Delete('reviews/:id') @UseGuards(AuthGuard) @HttpCode(204) deleteReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteReview(user.id, id);
  }
  @Post('saas/:id/favorite') @UseGuards(AuthGuard) favorite(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.service.favorite(user.id, id);
  }
  @Delete('saas/:id/favorite') @UseGuards(AuthGuard) unfavorite(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.service.unfavorite(user.id, id);
  }
  @Get('me/favorites') @UseGuards(AuthGuard) favorites(
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.favorites(user.id);
  }
}
