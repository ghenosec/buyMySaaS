import {
  AnalyticsEventType,
  DealType,
  PricingType,
  PrismaClient,
} from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();
const categories = [
  [
    'Inteligência Artificial',
    'inteligencia-artificial',
    'Produtos com inteligência artificial',
    'Sparkles',
  ],
  [
    'Produtividade',
    'produtividade',
    'Ferramentas para trabalhar melhor',
    'Zap',
  ],
  [
    'Desenvolvimento',
    'desenvolvimento',
    'APIs e ferramentas para devs',
    'Code2',
  ],
  ['Marketing', 'marketing', 'Aquisição, conteúdo e SEO', 'Megaphone'],
  ['Vendas', 'vendas', 'CRM e automação comercial', 'BadgeDollarSign'],
  ['Design', 'design', 'Criação e colaboração visual', 'Palette'],
  ['Financeiro', 'financeiro', 'Gestão financeira e pagamentos', 'Landmark'],
  ['Educação', 'educacao', 'Ensino e aprendizagem', 'GraduationCap'],
  ['Automação', 'automacao', 'Fluxos e integrações', 'Workflow'],
  [
    'Analytics',
    'analytics',
    'Métricas e inteligência de dados',
    'ChartNoAxesCombined',
  ],
  [
    'E-commerce',
    'e-commerce',
    'Ferramentas para comércio digital',
    'ShoppingBag',
  ],
  ['Recursos Humanos', 'recursos-humanos', 'Pessoas e cultura', 'Users'],
  ['Social Media', 'social-media', 'Conteúdo e comunidades', 'MessagesSquare'],
  ['Segurança', 'seguranca', 'Privacidade e proteção', 'ShieldCheck'],
  ['Outros', 'outros', 'Soluções independentes diversas', 'Shapes'],
] as const;
const products = [
  [
    'MetricFox',
    'Analytics simples para produtos que estão começando',
    'Entenda seus visitantes sem dashboards infinitos.',
    'analytics',
    PricingType.SUBSCRIPTION,
    1900,
  ],
  [
    'NotaFlow',
    'Transforme reuniões em tarefas claras',
    'Notas automáticas, decisões e follow-ups em um só lugar.',
    'produtividade',
    PricingType.FREEMIUM,
    0,
  ],
  [
    'DeployMate',
    'Checklist de deploy que seu time realmente usa',
    'Releases previsíveis para equipes pequenas.',
    'desenvolvimento',
    PricingType.SUBSCRIPTION,
    2900,
  ],
  [
    'CopyLume',
    'Conteúdo de marketing com a voz da sua marca',
    'Crie campanhas consistentes em minutos.',
    'marketing',
    PricingType.SUBSCRIPTION,
    3900,
  ],
  [
    'PixBoard',
    'Fluxo de caixa visual para negócios digitais',
    'Veja entradas, saídas e projeções sem planilhas frágeis.',
    'financeiro',
    PricingType.SUBSCRIPTION,
    2000,
  ],
  [
    'FormBee',
    'Formulários bonitos que convertem mais',
    'Publique pesquisas e formulários sem código.',
    'marketing',
    PricingType.FREEMIUM,
    0,
  ],
  [
    'QueuePilot',
    'Filas de jobs sem dor de cabeça',
    'Monitore e reexecute jobs em uma interface direta.',
    'desenvolvimento',
    PricingType.SUBSCRIPTION,
    4900,
  ],
  [
    'ShopPulse',
    'Alertas inteligentes para sua loja',
    'Descubra quedas de conversão antes que virem problema.',
    'e-commerce',
    PricingType.SUBSCRIPTION,
    5900,
  ],
  [
    'Briefly',
    'Briefings que alinham clientes e designers',
    'Colete contexto e aprove trabalhos em um fluxo curto.',
    'design',
    PricingType.ONE_TIME,
    7900,
  ],
  [
    'TutorLoop',
    'Área de membros para educadores independentes',
    'Cursos, comunidade e progresso sem plataforma pesada.',
    'educacao',
    PricingType.SUBSCRIPTION,
    1900,
  ],
  [
    'SafeWebhook',
    'Inspecione e reenvie webhooks com segurança',
    'Debug local e histórico para integrações críticas.',
    'seguranca',
    PricingType.FREEMIUM,
    0,
  ],
  [
    'PeoplePing',
    'Rituais leves para times remotos',
    'Check-ins, humor e reconhecimento sem reuniões extras.',
    'recursos-humanos',
    PricingType.SUBSCRIPTION,
    1800,
  ],
  [
    'PostMint',
    'Calendário social para pequenos negócios',
    'Planeje, revise e publique conteúdo com seu time.',
    'social-media',
    PricingType.SUBSCRIPTION,
    2400,
  ],
  [
    'AutoDesk BR',
    'Automatize operações com blocos simples',
    'Integre suas ferramentas em minutos.',
    'automacao',
    PricingType.LIFETIME,
    9900,
  ],
  [
    'LeadGarden',
    'CRM simples para consultores independentes',
    'Cuide de oportunidades sem virar operador de CRM.',
    'vendas',
    PricingType.FREE,
    0,
  ],
] as const;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.publicationOrder.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.saasScreenshot.deleteMany();
  await prisma.saasCategory.deleteMany();
  await prisma.saas.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  const passwordHash = await hash('Dev12345!');
  const [admin, ana, bruno, clara] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin Buy My SaaS',
        email: 'admin@buymysaas.dev',
        passwordHash,
        role: 'ADMIN',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ana Maker',
        email: 'ana@buymysaas.dev',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bruno Indie',
        email: 'bruno@buymysaas.dev',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Clara Dev',
        email: 'clara@buymysaas.dev',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);
  const categoryMap = new Map<string, string>();
  for (const [name, slug, description, icon] of categories) {
    const category = await prisma.category.create({
      data: { name, slug, description, icon },
    });
    categoryMap.set(slug, category.id);
  }
  const owners = [ana, bruno, clara];
  const created = [];
  for (const [index, product] of products.entries()) {
    const [
      name,
      tagline,
      shortDescription,
      categorySlug,
      pricingType,
      priceCents,
    ] = product;
    const owner = owners[index % owners.length];
    const saas = await prisma.saas.create({
      data: {
        ownerId: owner.id,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        tagline,
        shortDescription,
        description: `${shortDescription}\n\nCriado por uma equipe independente brasileira para resolver um problema específico com simplicidade. Inclui onboarding rápido, suporte próximo e atualizações frequentes.`,
        logoUrl: `https://api.dicebear.com/9.x/shapes/png?seed=${encodeURIComponent(name)}`,
        countryCode: index === 6 ? 'US' : 'BR',
        language: 'pt-BR',
        websiteUrl: `https://example.com/${name.toLowerCase()}`,
        trialUrl:
          index % 3 === 0
            ? `https://example.com/${name.toLowerCase()}/trial`
            : null,
        checkoutUrl:
          pricingType !== PricingType.FREE
            ? `https://example.com/${name.toLowerCase()}/buy`
            : null,
        pricingType,
        priceCents,
        currency: 'BRL',
        billingInterval:
          pricingType === PricingType.SUBSCRIPTION
            ? 'MONTH'
            : pricingType === PricingType.LIFETIME ||
                pricingType === PricingType.ONE_TIME
              ? 'ONE_TIME'
              : null,
        isBrazilian: index !== 6,
        tags: [categorySlug, 'indie', index % 2 ? 'times' : 'makers'],
        technologies: ['Next.js', 'TypeScript'],
        status:
          index < 12 ? 'PUBLISHED' : index === 12 ? 'PENDING_REVIEW' : 'DRAFT',
        publishedAt:
          index < 12 ? new Date(Date.now() - index * 86_400_000) : null,
        launchDate: new Date(Date.now() - (index + 20) * 86_400_000),
        categories: {
          create: [
            { categoryId: categoryMap.get(categorySlug)! },
            ...(index % 4 === 0
              ? [{ categoryId: categoryMap.get('inteligencia-artificial')! }]
              : []),
          ],
        },
      },
    });
    created.push(saas);
  }
  for (const index of [2, 4, 8, 11])
    await prisma.deal.create({
      data: {
        saasId: created[index].id,
        type: index === 8 ? DealType.LIFETIME : DealType.DISCOUNT,
        originalPriceCents: (created[index].priceCents ?? 4900) * 2,
        promotionalPriceCents: created[index].priceCents ?? 4900,
        discountPercent: 50,
        startsAt: new Date(Date.now() - 2 * 86_400_000),
        endsAt: new Date(Date.now() + 30 * 86_400_000),
        couponCode: index === 11 ? 'INDIE20' : null,
      },
    });
  for (let index = 0; index < 9; index++) {
    await prisma.review.create({
      data: {
        userId: [admin, ana, bruno, clara][index % 4].id,
        saasId: created[index].id,
        rating: 4 + (index % 2),
        comment:
          index % 2
            ? 'Ferramenta muito bem resolvida e suporte próximo.'
            : 'Boa proposta, simples de começar e com experiência clara.',
      },
    });
  }
  await prisma.favorite.createMany({
    data: [
      { userId: ana.id, saasId: created[1].id },
      { userId: ana.id, saasId: created[4].id },
      { userId: bruno.id, saasId: created[0].id },
      { userId: clara.id, saasId: created[2].id },
    ],
  });
  const types = [
    AnalyticsEventType.PAGE_VIEW,
    AnalyticsEventType.PAGE_VIEW,
    AnalyticsEventType.PAGE_VIEW,
    AnalyticsEventType.WEBSITE_CLICK,
    AnalyticsEventType.TRIAL_CLICK,
    AnalyticsEventType.BUY_CLICK,
  ];
  const events = [];
  for (let day = 0; day < 30; day++)
    for (let index = 0; index < 12; index++)
      for (let count = 0; count < 3 + (index % 5); count++)
        events.push({
          saasId: created[index].id,
          type: types[(day + index + count) % types.length],
          createdAt: new Date(
            Date.now() - day * 86_400_000 - count * 3_600_000,
          ),
          visitorHash: `seed-${day}-${index}-${count}`,
        });
  await prisma.analyticsEvent.createMany({ data: events });
  console.log(
    `Seed concluído: ${created.length} SaaS. Login admin: admin@buymysaas.dev / Dev12345!`,
  );
}
main().finally(async () => prisma.$disconnect());
