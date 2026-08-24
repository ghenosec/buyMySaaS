'use client';
import { ShieldAlert } from 'lucide-react';
import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ageConfirmationKey = 'bms_age_confirmed';
const ageConfirmationEvent = 'bms-age-confirmed';

type AdultMediaProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string;
  alt: string;
  adult?: boolean;
};

export function AdultMedia({ adult, alt, style, ...props }: AdultMediaProps) {
  const [revealed, setRevealed] = useState(!adult);
  useEffect(() => {
    if (!adult) return;
    const confirmFromStorage = () =>
      setRevealed(localStorage.getItem(ageConfirmationKey) === 'true');
    confirmFromStorage();
    window.addEventListener(ageConfirmationEvent, confirmFromStorage);
    return () =>
      window.removeEventListener(ageConfirmationEvent, confirmFromStorage);
  }, [adult]);

  function reveal() {
    localStorage.setItem(ageConfirmationKey, 'true');
    window.dispatchEvent(new Event(ageConfirmationEvent));
    setRevealed(true);
    toast.success('Conteúdo liberado nesta sessão');
  }

  function requestConfirmation() {
    if (!adult || revealed) return;
    toast('Conteúdo destinado a maiores de 18 anos', {
      description:
        'Confirme que você tem 18 anos ou mais para revelar a imagem.',
      action: {
        label: 'Tenho +18',
        onClick: reveal,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={requestConfirmation}
      aria-label={
        adult && !revealed
          ? 'Imagem com conteúdo +18. Clique para confirmar idade.'
          : alt
      }
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        padding: 0,
        border: 0,
        borderRadius:
          typeof style === 'object' && style && 'borderRadius' in style
            ? style.borderRadius
            : 16,
        overflow: 'hidden',
        background: 'transparent',
        textAlign: 'inherit',
        cursor: adult && !revealed ? 'pointer' : 'default',
      }}
    >
      <Image
        {...props}
        alt={alt}
        style={{
          ...style,
          filter:
            adult && !revealed ? 'blur(16px) brightness(0.72)' : undefined,
          transform: adult && !revealed ? 'scale(1.02)' : undefined,
          transition: 'filter .2s ease, transform .2s ease',
        }}
      />
      {adult && !revealed ? (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 18,
            background: 'rgba(0, 0, 0, .28)',
            color: '#fff',
            fontWeight: 850,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 999,
              padding: '9px 13px',
              background: 'rgba(0, 0, 0, .55)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ShieldAlert size={18} />
            Conteúdo +18 — clique para confirmar
          </span>
        </span>
      ) : null}
    </button>
  );
}
