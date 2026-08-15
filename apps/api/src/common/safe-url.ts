import { BadRequestException } from '@nestjs/common';

export function assertSafeExternalUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('URL inválida');
  }
  const localDev =
    process.env.NODE_ENV !== 'production' &&
    url.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localDev)
    throw new BadRequestException('Use uma URL HTTPS');
  return url.toString();
}
