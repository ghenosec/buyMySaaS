import {
  Controller,
  Get,
  GoneException,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import { AuthService } from './auth.service';

const googleStateCookie = 'bms_google_oauth_state';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register() {
    throw new GoneException('Cadastro por email e senha foi desativado');
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  login() {
    throw new GoneException('Login por email e senha foi desativado');
  }

  @Get('google')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  google(@Req() request: Request, @Res() response: Response) {
    const state = randomBytes(32).toString('hex');
    response.cookie(googleStateCookie, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
    response.redirect(
      this.auth.googleAuthorizationUrl(state, this.redirectUri(request)),
    );
  }

  @Get('google/callback')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const cookieState = request.cookies?.[googleStateCookie] as
      string | undefined;
    response.clearCookie(googleStateCookie, { path: '/' });
    if (!code || !state || !cookieState || !this.safeEqual(state, cookieState))
      throw new GoneException(
        'Sessão de login Google expirada. Tente novamente.',
      );

    const result = await this.auth.loginWithGoogle(
      code,
      this.redirectUri(request),
    );
    this.setCookie(response, result.token);
    response.redirect(
      `${process.env.WEB_URL ?? 'http://localhost:3000'}/dashboard`,
    );
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
  forgot() {
    throw new GoneException(
      'Recuperação por senha foi desativada. Use Google.',
    );
  }

  @Post('reset-password')
  @HttpCode(501)
  reset() {
    throw new GoneException('Redefinição de senha foi desativada. Use Google.');
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

  private redirectUri(request: Request) {
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
    return `${request.protocol}://${request.get('host')}/api/v1/auth/google/callback`;
  }

  private safeEqual(a: string, b: string) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
