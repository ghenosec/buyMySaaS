'use client';
import { Menu, Moon, Plus, Sun, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { User } from '@/lib/types';

export function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => clientApi<User>('/auth/me'),
    retry: false,
    staleTime: 60_000,
  });
  const links = (
    <>
      <Link className="nav-link" href="/explore">
        Explorar
      </Link>
      <Link className="nav-link" href="/categories">
        Categorias
      </Link>
    </>
  );
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--line)',
        background: 'color-mix(in srgb,var(--bg) 88%,transparent)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="container"
        style={{ height: 68, display: 'flex', alignItems: 'center', gap: 24 }}
      >
        <Link
          href="/"
          aria-label="Buy My SaaS — início"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 900,
            letterSpacing: '-.04em',
            fontSize: 20,
          }}
        >
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            style={{
              width: 34,
              height: 34,
              objectFit: 'contain',
            }}
            priority
          />
          Buy My SaaS
        </Link>
        <nav
          className="desktop-nav"
          style={{ display: 'flex', gap: 22, alignItems: 'center' }}
        >
          {links}
        </nav>
        <div style={{ flex: 1 }} />
        <Link
          className="btn btn-ghost btn-sm desktop-nav"
          href="/dashboard/saas/new"
        >
          <Plus size={16} /> Publicar meu SaaS
        </Link>
        <button
          className="btn btn-ghost btn-sm"
          aria-label="Alternar tema"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && resolvedTheme === 'dark' ? (
            <Sun size={16} />
          ) : (
            <Moon size={16} />
          )}
        </button>
        {user ? (
          <Link
            className="btn btn-primary btn-sm desktop-nav"
            href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
          >
            {user.name.split(' ')[0]}
          </Link>
        ) : (
          <Link className="btn btn-sm desktop-nav" href="/login">
            Entrar
          </Link>
        )}
        <button
          className="btn btn-ghost btn-sm mobile-only"
          aria-label="Abrir menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <nav
          className="container mobile-only"
          style={{
            padding: '0 0 18px',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 14,
          }}
        >
          {links}
          <Link
            className="btn btn-primary"
            href={user ? '/dashboard' : '/login'}
          >
            {user ? 'Abrir dashboard' : 'Entrar'}
          </Link>
          <Link className="btn" href="/dashboard/saas/new">
            <Plus size={16} />
            Publicar meu SaaS
          </Link>
        </nav>
      )}
    </header>
  );
}
