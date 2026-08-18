import { PrismaClient } from '@prisma/client';
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
async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.publicationOrder.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.saasScreenshot.deleteMany();
  await prisma.saasCategory.deleteMany();
  await prisma.saas.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  const passwordHash = await hash('Dev12345!');
  await prisma.user.create({
    data: {
      name: 'Admin Buy My SaaS',
      email: 'admin@buymysaas.dev',
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  for (const [name, slug, description, icon] of categories) {
    await prisma.category.create({
      data: { name, slug, description, icon },
    });
  }
  console.log(
    'Seed concluído: catálogo sem SaaS de demonstração. Login admin: admin@buymysaas.dev / Dev12345!',
  );
}
void main().finally(async () => prisma.$disconnect());
