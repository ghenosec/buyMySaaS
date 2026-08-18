'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientApi } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.email(),
  password: z.string().min(8),
});
type Values = z.infer<typeof schema>;
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => setMounted(true), []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  async function submit(values: Values) {
    try {
      await clientApi(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(mode === 'login' ? 'Bem-vindo de volta' : 'Conta criada');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível continuar',
      );
    }
  }
  return (
    <form
      className="card stack"
      style={{ padding: 26 }}
      onSubmit={handleSubmit(submit)}
    >
      {mode === 'register' && (
        <label className="label">
          Nome
          <input className="input" {...register('name')} autoComplete="name" />
          {errors.name && (
            <small className="error">{errors.name.message}</small>
          )}
        </label>
      )}
      <label className="label">
        Email
        <input
          className="input"
          type="email"
          {...register('email')}
          autoComplete="email"
        />
        {errors.email && <small className="error">Email inválido</small>}
      </label>
      <label className="label">
        Senha
        <input
          className="input"
          type="password"
          {...register('password')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {errors.password && (
          <small className="error">Use pelo menos 8 caracteres</small>
        )}
      </label>
      <button className="btn btn-primary" disabled={!mounted || isSubmitting}>
        {isSubmitting
          ? 'Aguarde...'
          : mode === 'login'
            ? 'Entrar'
            : 'Criar conta'}
        <ArrowRight size={17} />
      </button>
      {mode === 'login' ? (
        <>
          <Link className="nav-link" href="/forgot-password">
            Esqueci minha senha
          </Link>
          <p className="muted">
            Ainda não tem conta?{' '}
            <Link
              href="/register"
              style={{ color: 'var(--brand)', fontWeight: 800 }}
            >
              Cadastre-se
            </Link>
          </p>
        </>
      ) : (
        <p className="muted">
          Já tem conta?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--brand)', fontWeight: 800 }}
          >
            Entrar
          </Link>
        </p>
      )}
    </form>
  );
}
