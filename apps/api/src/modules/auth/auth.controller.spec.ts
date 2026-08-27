import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController cross-site session cookie', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('uses Secure and SameSite=None for the production session', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WEB_URL = 'https://buy-my-saas.vercel.app';
    process.env.GOOGLE_REDIRECT_URI =
      'https://buy-my-saas-api.up.railway.app/api/v1/auth/google/callback';
    const auth = {
      loginWithGoogle: jest.fn().mockResolvedValue({ token: 'signed-session' }),
    } as unknown as AuthService;
    const controller = new AuthController(auth);
    const cookie = jest.fn();
    const redirect = jest.fn();
    const response = {
      clearCookie: jest.fn(),
      cookie,
      redirect,
    } as unknown as Response;
    const request = {
      cookies: { bms_google_oauth_state: 'expected-state' },
    } as unknown as Request;

    await controller.googleCallback(
      'authorization-code',
      'expected-state',
      request,
      response,
    );

    expect(cookie).toHaveBeenCalledWith(
      'bms_session',
      'signed-session',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
    expect(redirect).toHaveBeenCalledWith(
      'https://buy-my-saas.vercel.app/dashboard',
    );
  });
});
