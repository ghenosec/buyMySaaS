import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto);
    this.setCookie(response, result.token);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto);
    this.setCookie(response, result.token);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(process.env.AUTH_COOKIE_NAME ?? 'bms_session', {
      path: '/',
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Post('forgot-password')
  @HttpCode(202)
  forgot(@Body() dto: ForgotPasswordDto) {
    void dto;
    return { message: 'Se o email existir, enviaremos instruções.' };
  }

  @Post('reset-password')
  @HttpCode(501)
  reset(@Body() dto: ResetPasswordDto) {
    void dto;
    return {
      message: 'Fluxo preparado; configure um provedor de email para ativar.',
    };
  }

  private setCookie(response: Response, token: string) {
    response.cookie(process.env.AUTH_COOKIE_NAME ?? 'bms_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
