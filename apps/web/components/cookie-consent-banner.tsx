'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const consentCookie = 'bms_cookie_consent';

function hasConsent() {
  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${consentCookie}=`));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasConsent());
  }, []);

  function accept() {
    document.cookie = `${consentCookie}=accepted; Max-Age=31536000; Path=/; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite">
      <div>
        <strong>Usamos cookies necessários</strong>
        <p>
          Eles mantêm sua sessão segura, salvam sua preferência de cookies e
          ajudam no funcionamento básico do Buy My SaaS.
        </p>
      </div>
      <div className="cookie-actions">
        <Link className="btn btn-ghost btn-sm" href="/privacy">
          Ver privacidade
        </Link>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={accept}
        >
          Aceitar cookies
        </button>
      </div>
    </div>
  );
}
