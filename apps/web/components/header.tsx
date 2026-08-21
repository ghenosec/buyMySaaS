'use client';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { User } from '@/lib/types';
import { PublishSaasLink } from './publish-saas-link';

export function Header() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => clientApi<User>('/auth/me'),
    retry: false,
    staleTime: 60_000,
  });
  const dashboardHref = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
  const logout = useMutation({
    mutationFn: () => clientApi<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      setAccountOpen(false);
      setOpen(false);
      queryClient.setQueryData(['me'], null);
      queryClient.removeQueries({ queryKey: ['me'] });
      router.push('/');
      router.refresh();
    },
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
        <PublishSaasLink className="btn btn-ghost btn-sm desktop-nav" />
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
          <div
            className="desktop-nav"
            style={{ position: 'relative', display: 'flex' }}
          >
            <button
              className="btn btn-primary btn-sm"
              type="button"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => setAccountOpen((current) => !current)}
            >
              {user.name.split(' ')[0]}
              <ChevronDown size={14} />
            </button>
            {accountOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 190,
                  padding: 8,
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <Link
                  className="account-menu-item"
                  href={dashboardHref}
                  role="menuitem"
                  onClick={() => setAccountOpen(false)}
                >
                  <LayoutDashboard size={15} />
                  {user.role === 'ADMIN' ? 'Admin' : 'Dashboard'}
                </Link>
                <button
                  className="account-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            )}
          </div>
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
          {user ? (
            <>
              <Link className="btn btn-primary" href={dashboardHref}>
                Abrir dashboard
              </Link>
              <button
                className="btn"
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut size={16} />
                Sair
              </button>
            </>
          ) : (
            <Link className="btn btn-primary" href="/login">
              Entrar
            </Link>
          )}
          <PublishSaasLink className="btn" />
        </nav>
      )}
    </header>
  );
}
