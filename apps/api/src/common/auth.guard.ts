import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from './auth-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const cookieName = process.env.AUTH_COOKIE_NAME ?? 'bms_session';
    const token = request.cookies?.[cookieName] as string | undefined;
    if (!token) throw new UnauthorizedException('Faça login para continuar');
    try {
      request.user = this.jwt.verify<AuthUser>(token, {
        secret: process.env.AUTH_SECRET,
      });
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
  }
}
