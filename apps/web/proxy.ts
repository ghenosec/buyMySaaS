import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV !== 'production' ||
    isLocalHostname(request.nextUrl.hostname)
  )
    return NextResponse.next();

  const forwardedProtocol = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const protocol =
    forwardedProtocol ?? request.nextUrl.protocol.replace(':', '');
  if (protocol === 'https') return NextResponse.next();

  const configuredWebUrl = process.env.WEB_URL;
  if (!configuredWebUrl)
    return new NextResponse('WEB_URL não configurada', { status: 500 });
  const secureUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    configuredWebUrl,
  );
  return NextResponse.redirect(secureUrl, 308);
}

function isLocalHostname(hostname: string) {
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  );
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
