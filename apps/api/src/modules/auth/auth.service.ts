import {
  BadGatewayException,
  ServiceUnavailableException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  googleAuthorizationUrl(state: string, redirectUri: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId)
      throw new ServiceUnavailableException('GOOGLE_CLIENT_ID não configurado');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async loginWithGoogle(code: string, redirectUri: string) {
    const googleUser = await this.fetchGoogleUser(code, redirectUri);
    if (
      !googleUser.sub ||
      !googleUser.email ||
      googleUser.email_verified !== true
    )
      throw new UnauthorizedException('Conta Google sem email verificado');

    const email = googleUser.email.trim().toLowerCase();
    const existingByGoogle = await this.prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    const user = existingByGoogle
      ? await this.prisma.user.update({
          where: { id: existingByGoogle.id },
          data: {
            email,
            name: googleUser.name?.trim() || existingByGoogle.name,
            avatarUrl: googleUser.picture ?? existingByGoogle.avatarUrl,
            emailVerifiedAt: existingByGoogle.emailVerifiedAt ?? new Date(),
          },
        })
      : await this.connectOrCreateGoogleUser(googleUser.sub, email, googleUser);

    return this.session(user);
  }

  async me(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  private session(user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    avatarUrl: string | null;
  }) {
    const token = this.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { secret: process.env.AUTH_SECRET, expiresIn: '7d' },
    );
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private async connectOrCreateGoogleUser(
    googleId: string,
    email: string,
    googleUser: GoogleUserInfo,
  ) {
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingByEmail)
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId,
          name: googleUser.name?.trim() || existingByEmail.name,
          avatarUrl: googleUser.picture ?? existingByEmail.avatarUrl,
          emailVerifiedAt: existingByEmail.emailVerifiedAt ?? new Date(),
        },
      });

    return this.prisma.user.create({
      data: {
        googleId,
        email,
        name: googleUser.name?.trim() || email.split('@')[0],
        avatarUrl: googleUser.picture,
        emailVerifiedAt: new Date(),
      },
    });
  }

  private async fetchGoogleUser(code: string, redirectUri: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret)
      throw new ServiceUnavailableException('Google OAuth não configurado');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const token = (await tokenResponse.json().catch(() => ({}))) as
      GoogleTokenResponse | Record<string, never>;
    if (!tokenResponse.ok || !('access_token' in token) || !token.access_token)
      throw new BadGatewayException(
        token.error_description ??
          token.error ??
          'Não foi possível autenticar com o Google',
      );

    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    const profile = (await profileResponse.json().catch(() => ({}))) as
      GoogleUserInfo | Record<string, never>;
    if (!profileResponse.ok)
      throw new BadGatewayException('Google indisponível');
    return profile as GoogleUserInfo;
  }
}
