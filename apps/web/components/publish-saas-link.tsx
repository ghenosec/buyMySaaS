'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { browserApiUrl, clientApi } from '@/lib/api';
import { User } from '@/lib/types';

type Props = {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
};

export function PublishSaasLink({
  className = 'btn',
  children = 'Publicar grátis',
  showIcon = true,
}: Props) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => clientApi<User>('/auth/me'),
    retry: false,
    staleTime: 60_000,
  });
  const content = (
    <>
      {showIcon && <Plus size={16} />}
      {children}
    </>
  );

  if (!user)
    return (
      <a className={className} href={`${browserApiUrl}/auth/google`}>
        {content}
      </a>
    );

  return (
    <Link className={className} href="/dashboard/saas/new">
      {content}
    </Link>
  );
}
