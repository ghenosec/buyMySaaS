import { BadRequestException } from '@nestjs/common';
import { assertSafeExternalUrl } from './safe-url';

describe('assertSafeExternalUrl', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('allows localhost HTTP only outside production', () => {
    process.env.NODE_ENV = 'development';

    expect(assertSafeExternalUrl('http://localhost:3000/demo')).toBe(
      'http://localhost:3000/demo',
    );
  });

  it('rejects javascript URLs', () => {
    expect(() => assertSafeExternalUrl('javascript:alert(1)')).toThrow(
      BadRequestException,
    );
  });

  it('rejects URLs with embedded credentials', () => {
    expect(() =>
      assertSafeExternalUrl('https://user:pass@example.com'),
    ).toThrow(BadRequestException);
  });

  it('rejects local or private network URLs in production', () => {
    process.env.NODE_ENV = 'production';

    expect(() => assertSafeExternalUrl('https://localhost/admin')).toThrow(
      BadRequestException,
    );
    expect(() => assertSafeExternalUrl('https://192.168.0.1/router')).toThrow(
      BadRequestException,
    );
  });
});
