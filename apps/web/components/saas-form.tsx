'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Save, Send, Trash2 } from 'lucide-react';
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
  priceInput: z
    .string()
    .max(20)
    .refine((value) => isValidPriceInput(value), {
      message: 'Use um valor válido, ex: 6,90',
    }),
  currency: z.string().length(3),
  billingInterval: z.enum(['MONTH', 'YEAR', 'ONE_TIME']).optional(),
  pricingLabel: z.string().max(60).optional(),
  tagsText: z.string(),
  technologiesText: z.string(),
  categoryIds: z.array(z.string()).min(1).max(3),
  logoUrl: z.string().optional(),
  screenshotUrls: z.array(z.url()).max(6),
  isAdult: z.boolean(),
});
type Values = z.infer<typeof schema>;
const logoMaxSizeBytes = 5 * 1024 * 1024;
const allowedLogoTypes = ['image/png', 'image/jpeg', 'image/webp'];

function normalizePriceInput(value: string) {
  return value.trim().replace(/\./g, '').replace(',', '.');
}

function isValidPriceInput(value: string) {
  if (!value.trim()) return true;
  const price = Number(normalizePriceInput(value));
  return Number.isFinite(price) && price >= 0;
}

function priceInputToCents(value: string) {
  if (!value.trim()) return undefined;
  return Math.round(Number(normalizePriceInput(value)) * 100);
}

function centsToPriceInput(cents?: number | null) {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const defaults: Values = {
  name: '',
  tagline: '',
  shortDescription: '',
  description: '',
  countryCode: 'BR',
  language: 'pt-BR',
  websiteUrl: '',
  trialUrl: '',
  checkoutUrl: '',
  pricingType: 'FREEMIUM',
  priceInput: '',
  currency: 'BRL',
  billingInterval: 'MONTH',
  pricingLabel: '',
  tagsText: '',
  technologiesText: '',
  categoryIds: [],
  logoUrl: '',
  screenshotUrls: [],
  isAdult: false,
};
export function SaasForm({ id }: { id?: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
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
  const logoUrl = watch('logoUrl');
  const screenshotUrls = watch('screenshotUrls');
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
        screenshotUrls: item.screenshots?.map((s) => s.url) ?? [],
        isAdult: item.isAdult ?? false,
        trialUrl: item.trialUrl ?? '',
        checkoutUrl: item.checkoutUrl ?? '',
        priceInput: centsToPriceInput(item.priceCents),
        billingInterval: item.billingInterval ?? undefined,
        pricingLabel: item.pricingLabel ?? '',
        tagsText: item.tags.join(', '),
        technologiesText: item.technologies.join(', '),
        categoryIds: item.categories?.map((c) => c.category.id) ?? [],
      });
  }, [item, reset]);
  async function submit(values: Values) {
    const { tagsText, technologiesText, priceInput, ...rest } = values;
    const payload = {
      ...rest,
      priceCents: priceInputToCents(priceInput),
      tags: tagsText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      technologies: technologiesText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      trialUrl: values.trialUrl || undefined,
      checkoutUrl: values.checkoutUrl || undefined,
      logoUrl: values.logoUrl || undefined,
      screenshotUrls: values.screenshotUrls,
    };
    try {
      const saved = await clientApi<Saas>(id ? `/me/saas/${id}` : '/me/saas', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      if (id && saved.requiresReapproval) {
        toast.success('Alterações enviadas para reaprovação');
        router.push('/dashboard/saas');
      } else if (id && saved.status === 'PUBLISHED') {
        toast.success('Alterações salvas');
        router.push('/dashboard/saas');
      } else {
        toast.success(id ? 'Alterações salvas' : 'Rascunho criado');
        router.push(`/dashboard/saas/${saved.id}/review`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar',
      );
    }
  }
  async function uploadImage(file: File, label: string) {
    if (!allowedLogoTypes.includes(file.type))
      throw new Error(`Envie ${label} em PNG, JPEG ou WebP`);
    if (file.size > logoMaxSizeBytes)
      throw new Error(`${label} precisa ter até 5 MB`);
    const data = new FormData();
    data.append('file', file);
    return clientApi<{ url: string }>('/uploads', {
      method: 'POST',
      body: data,
    });
  }
  async function uploadLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, 'uma logo');
      setValue('logoUrl', result.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success('Logo enviado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no upload');
    } finally {
      setUploading(false);
    }
  }
  async function uploadScreenshots(files: File[]) {
    if (!files.length) return;
    const remainingSlots = 6 - screenshotUrls.length;
    if (remainingSlots <= 0) {
      toast.error('Você pode enviar até 6 imagens de exemplo');
      return;
    }
    const selected = files.slice(0, remainingSlots);
    if (files.length > remainingSlots)
      toast.error(`Só mais ${remainingSlots} imagem(ns) serão enviadas`);
    setUploadingScreenshots(true);
    try {
      const uploaded = [];
      for (const file of selected) {
        const result = await uploadImage(file, 'imagens de exemplo');
        uploaded.push(result.url);
      }
      setValue('screenshotUrls', [...screenshotUrls, ...uploaded], {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(
        uploaded.length === 1
          ? 'Imagem de exemplo enviada'
          : 'Imagens de exemplo enviadas',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no upload');
    } finally {
      setUploadingScreenshots(false);
    }
  }
  function removeLogo() {
    setValue('logoUrl', '', { shouldDirty: true, shouldValidate: true });
    toast.success('Logo removida');
  }
  function removeScreenshot(url: string) {
    setValue(
      'screenshotUrls',
      screenshotUrls.filter((item) => item !== url),
      { shouldDirty: true, shouldValidate: true },
    );
    toast.success('Imagem removida');
  }
  return (
    <form className="stack" onSubmit={handleSubmit(submit)}>
      {item?.status === 'PUBLISHED' ? (
        <div className="notice">
          <strong>Edições sensíveis exigem reaprovação.</strong> Alterações em
          nome, textos públicos, links, logo, imagens, categorias, tags ou
          classificação +18 retiram o anúncio temporariamente do catálogo.
        </div>
      ) : null}
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
              <input
                className="input"
                {...register('name')}
                placeholder="Ex: TravelDesk"
              />
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
              placeholder="Ex: Plataforma para agências organizarem clientes, viagens e pagamentos em um só lugar."
            />
            <small className="error">{errors.shortDescription?.message}</small>
          </label>
          <label className="label">
            Descrição completa
            <textarea
              className="input"
              {...register('description')}
              placeholder={`Ex: O TravelDesk ajuda agências de turismo a controlar reservas, clientes, roteiros e pagamentos em uma única tela.

Ideal para equipes que querem reduzir planilhas, evitar retrabalho e acompanhar cada viagem do orçamento ao pós-venda.`}
            />
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
          <div
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: '82px minmax(0, 1fr)',
              gap: 16,
              alignItems: 'center',
              padding: 14,
            }}
          >
            <div
              aria-label={logoUrl ? 'Prévia da logo enviada' : 'Sem logo'}
              role="img"
              style={{
                width: 82,
                height: 82,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                borderRadius: 18,
                border: '1px solid var(--line)',
                background: logoUrl
                  ? `center / cover no-repeat url("${logoUrl.replace(/"/g, '%22')}")`
                  : 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                color: 'var(--muted)',
              }}
            >
              {!logoUrl && <ImageIcon size={28} />}
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <label className="label">
                Logo do SaaS/produto
                <input
                  className="input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    void uploadLogo(e.currentTarget.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                />
                <span className="muted">
                  {uploading
                    ? 'Enviando logo...'
                    : logoUrl
                      ? 'Logo pronta. Ela aparecerá no card e na página do produto.'
                      : 'PNG, JPEG ou WebP, até 5 MB.'}
                </span>
              </label>
              {logoUrl ? (
                <div>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={removeLogo}
                  >
                    <Trash2 size={15} /> Remover logo
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="card stack" style={{ padding: 14 }}>
            <label className="label">
              Imagens de exemplo do produto
              <input
                className="input"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  void uploadScreenshots(
                    Array.from(e.currentTarget.files ?? []),
                  );
                  e.currentTarget.value = '';
                }}
              />
              <span className="muted">
                {uploadingScreenshots
                  ? 'Enviando imagens...'
                  : `${screenshotUrls.length}/6 imagens enviadas. Use prints reais do produto em PNG, JPEG ou WebP.`}
              </span>
            </label>
            {screenshotUrls.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                }}
              >
                {screenshotUrls.map((url, index) => (
                  <div className="card stack" style={{ padding: 10 }} key={url}>
                    <div
                      aria-label={`Imagem de exemplo ${index + 1}`}
                      role="img"
                      style={{
                        aspectRatio: '16 / 10',
                        borderRadius: 12,
                        border: '1px solid var(--line)',
                        background: `center / cover no-repeat url("${url.replace(/"/g, '%22')}")`,
                      }}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => removeScreenshot(url)}
                    >
                      <Trash2 size={15} /> Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
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
          <label
            className="notice"
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontWeight: 700,
            }}
          >
            <input type="checkbox" {...register('isAdult')} />
            <span>
              Produto +18
              <br />
              <small className="muted">
                Marque se o SaaS, suas imagens ou sua proposta forem destinadas
                somente a maiores de 18 anos. Se fizer sentido, selecione também
                a categoria Adulto +18.
              </small>
            </span>
          </label>
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
            <input
              className="input"
              {...register('websiteUrl')}
              placeholder="Ex: https://seudominio.com"
            />
            <small className="error">{errors.websiteUrl?.message}</small>
          </label>
          <div className="two-col">
            <label className="label">
              URL de trial
              <input
                className="input"
                {...register('trialUrl')}
                placeholder="Ex: https://seudominio.com/testar"
              />
            </label>
            <label className="label">
              URL de checkout
              <input
                className="input"
                {...register('checkoutUrl')}
                placeholder="Ex: https://pay.seudominio.com/produto"
              />
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
              Preço inicial
              <input
                className="input"
                inputMode="decimal"
                placeholder="Ex: 6,90"
                {...register('priceInput')}
              />
              <span className="muted">
                Digite em reais. Ex.: 6,90 para R$ 6,90. Use 0 para grátis.
              </span>
              <small className="error">{errors.priceInput?.message}</small>
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
