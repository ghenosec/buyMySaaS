'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientApi } from '@/lib/api';
import { Category, Saas } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2).max(80),
  tagline: z.string().min(3).max(120),
  shortDescription: z.string().min(20).max(220),
  description: z.string().min(40).max(10000),
  countryCode: z.string().length(2),
  language: z.string().min(2),
  websiteUrl: z.url(),
  trialUrl: z.union([z.url(), z.literal('')]),
  checkoutUrl: z.union([z.url(), z.literal('')]),
  pricingType: z.enum([
    'FREE',
    'FREEMIUM',
    'SUBSCRIPTION',
    'ONE_TIME',
    'LIFETIME',
    'CUSTOM',
  ]),
  priceCents: z.number().min(0).optional(),
  currency: z.string().length(3),
  billingInterval: z.enum(['MONTH', 'YEAR', 'ONE_TIME']).optional(),
  pricingLabel: z.string().max(60).optional(),
  tagsText: z.string(),
  technologiesText: z.string(),
  categoryIds: z.array(z.string()).min(1).max(3),
  logoUrl: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const defaults: Values = {
  name: '',
  tagline: '',
  shortDescription: '',
  description: '',
  countryCode: 'BR',
  language: 'pt-BR',
  websiteUrl: 'https://',
  trialUrl: '',
  checkoutUrl: '',
  pricingType: 'FREEMIUM',
  priceCents: 0,
  currency: 'BRL',
  billingInterval: 'MONTH',
  pricingLabel: '',
  tagsText: '',
  technologiesText: '',
  categoryIds: [],
  logoUrl: '',
};
export function SaasForm({ id }: { id?: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => clientApi<Category[]>('/categories'),
  });
  const { data: item } = useQuery({
    queryKey: ['saas-edit', id],
    queryFn: () => clientApi<Saas>(`/me/saas/${id}`),
    enabled: Boolean(id),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (item)
      reset({
        ...defaults,
        name: item.name,
        tagline: item.tagline,
        shortDescription: item.shortDescription,
        description: item.description,
        countryCode: item.countryCode,
        language: item.language,
        websiteUrl: item.websiteUrl,
        pricingType: item.pricingType,
        currency: item.currency,
        logoUrl: item.logoUrl ?? '',
        trialUrl: item.trialUrl ?? '',
        checkoutUrl: item.checkoutUrl ?? '',
        priceCents: item.priceCents ?? 0,
        billingInterval: item.billingInterval ?? undefined,
        pricingLabel: item.pricingLabel ?? '',
        tagsText: item.tags.join(', '),
        technologiesText: item.technologies.join(', '),
        categoryIds: item.categories?.map((c) => c.category.id) ?? [],
      });
  }, [item, reset]);
  async function submit(values: Values) {
    const payload = {
      ...values,
      tags: values.tagsText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      technologies: values.technologiesText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      trialUrl: values.trialUrl || undefined,
      checkoutUrl: values.checkoutUrl || undefined,
      logoUrl: values.logoUrl || undefined,
    };
    delete (payload as Partial<typeof payload>).tagsText;
    delete (payload as Partial<typeof payload>).technologiesText;
    try {
      const saved = await clientApi<Saas>(id ? `/me/saas/${id}` : '/me/saas', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(id ? 'Alterações salvas' : 'Rascunho criado');
      router.push(`/dashboard/saas/${saved.id}/review`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar',
      );
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const result = await clientApi<{ url: string }>('/uploads', {
        method: 'POST',
        body: data,
      });
      setValue('logoUrl', result.url);
      toast.success('Logo enviado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no upload');
    } finally {
      setUploading(false);
    }
  }
  return (
    <form className="stack" onSubmit={handleSubmit(submit)}>
      <fieldset
        disabled={!mounted || Boolean(id && !item) || isSubmitting}
        aria-busy={!mounted || Boolean(id && !item)}
        style={{ border: 0, padding: 0, margin: 0, display: 'contents' }}
      >
        <section className="card stack" style={{ padding: 24 }}>
          <div>
            <span className="eyebrow">1. Essencial</span>
            <h2>Conte o que você construiu</h2>
          </div>
          <div className="two-col">
            <label className="label">
              Nome
              <input className="input" {...register('name')} />
              <small className="error">{errors.name?.message}</small>
            </label>
            <label className="label">
              Tagline
              <input
                className="input"
                {...register('tagline')}
                placeholder="Uma frase clara sobre o valor"
              />
              <small className="error">{errors.tagline?.message}</small>
            </label>
          </div>
          <label className="label">
            Descrição curta
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              {...register('shortDescription')}
            />
            <small className="error">{errors.shortDescription?.message}</small>
          </label>
          <label className="label">
            Descrição completa
            <textarea className="input" {...register('description')} />
            <small className="error">{errors.description?.message}</small>
          </label>
          <div className="two-col">
            <label className="label">
              País
              <input
                className="input"
                maxLength={2}
                {...register('countryCode')}
              />
            </label>
            <label className="label">
              Idioma
              <input className="input" {...register('language')} />
            </label>
          </div>
        </section>
        <section className="card stack" style={{ padding: 24 }}>
          <div>
            <span className="eyebrow">2. Branding e categoria</span>
            <h2>Ajude as pessoas a reconhecer</h2>
          </div>
          <label className="label">
            Logo
            <input
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <span className="muted">
              {uploading
                ? 'Enviando...'
                : watch('logoUrl')
                  ? 'Logo pronto'
                  : 'PNG, JPEG ou WebP, até 5 MB'}
            </span>
          </label>
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend className="label">Categorias (até 3)</legend>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 9,
              }}
            >
              {categories.map((c) => (
                <label className="pill" key={c.id}>
                  <input
                    type="checkbox"
                    value={c.id}
                    {...register('categoryIds')}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <small className="error">{errors.categoryIds?.message}</small>
          </fieldset>
          <div className="two-col">
            <label className="label">
              Tags
              <input
                className="input"
                {...register('tagsText')}
                placeholder="analytics, indie, equipes"
              />
            </label>
            <label className="label">
              Tecnologias
              <input
                className="input"
                {...register('technologiesText')}
                placeholder="Next.js, TypeScript"
              />
            </label>
          </div>
        </section>
        <section className="card stack" style={{ padding: 24 }}>
          <div>
            <span className="eyebrow">3. Preço e links</span>
            <h2>Deixe a proposta fácil de entender</h2>
          </div>
          <label className="label">
            Website HTTPS
            <input className="input" {...register('websiteUrl')} />
            <small className="error">{errors.websiteUrl?.message}</small>
          </label>
          <div className="two-col">
            <label className="label">
              URL de trial
              <input className="input" {...register('trialUrl')} />
            </label>
            <label className="label">
              URL de checkout
              <input className="input" {...register('checkoutUrl')} />
            </label>
          </div>
          <div className="two-col">
            <label className="label">
              Modelo
              <select className="input" {...register('pricingType')}>
                <option value="FREE">Grátis</option>
                <option value="FREEMIUM">Freemium</option>
                <option value="SUBSCRIPTION">Assinatura</option>
                <option value="ONE_TIME">Pagamento único</option>
                <option value="LIFETIME">Lifetime</option>
                <option value="CUSTOM">Customizado</option>
              </select>
            </label>
            <label className="label">
              Preço inicial em centavos
              <input
                className="input"
                type="number"
                min="0"
                {...register('priceCents', { valueAsNumber: true })}
              />
            </label>
          </div>
          <div className="two-col">
            <label className="label">
              Moeda
              <input
                className="input"
                maxLength={3}
                {...register('currency')}
              />
            </label>
            <label className="label">
              Periodicidade
              <select className="input" {...register('billingInterval')}>
                <option value="MONTH">Mensal</option>
                <option value="YEAR">Anual</option>
                <option value="ONE_TIME">Único</option>
              </select>
            </label>
          </div>
        </section>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-primary" disabled={isSubmitting}>
            {id ? <Save size={17} /> : <Send size={17} />}{' '}
            {isSubmitting ? 'Salvando...' : 'Salvar e revisar'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
