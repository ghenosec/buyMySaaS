'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { browserApiUrl, clientApi } from '@/lib/api';
import { User } from '@/lib/types';

export function RequireGoogleLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => clientApi<User>('/auth/me'),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (error) window.location.href = `${browserApiUrl}/auth/google`;
  }, [error]);

  if (isLoading || error || !user)
    return (
      <div className="notice" style={{ marginTop: 32 }}>
        Redirecionando para login com Google...
      </div>
    );

  return children;
}
