import { BadRequestException } from '@nestjs/common';

export function assertSafeExternalUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('URL inválida');
  }
  if (url.username || url.password)
    throw new BadRequestException('Não inclua credenciais na URL');
  const localDev =
    process.env.NODE_ENV !== 'production' &&
    url.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localDev)
    throw new BadRequestException('Use uma URL HTTPS');
  if (
    process.env.NODE_ENV === 'production' &&
    isPrivateOrLocalHost(url.hostname)
  )
    throw new BadRequestException('Use uma URL pública');
  return url.toString();
}

function isPrivateOrLocalHost(hostname: string) {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    host === '0:0:0:0:0:0:0:1'
  )
    return true;
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part)))
    return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}
