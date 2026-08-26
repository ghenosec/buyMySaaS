import { PrismaClient } from '../src/generated/prisma/client';
import { createPrismaAdapter } from '../src/modules/prisma/prisma-adapter';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });
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
  [
    'Adulto +18',
    'adulto-18',
    'Produtos destinados somente a maiores de 18 anos',
    'BadgeAlert',
  ],
  ['Outros', 'outros', 'Soluções independentes diversas', 'Shapes'],
] as const;
async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.saasBoost.deleteMany();
  await prisma.review.deleteMany();
  await prisma.saasScreenshot.deleteMany();
  await prisma.saasCategory.deleteMany();
  await prisma.saas.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Admin Buy My SaaS';
  if (adminEmail) {
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        role: 'ADMIN',
        emailVerifiedAt: new Date(),
      },
    });
  }
  for (const [name, slug, description, icon] of categories) {
    await prisma.category.create({
      data: { name, slug, description, icon },
    });
  }
  console.log(
    adminEmail
      ? `Seed concluído: catálogo sem SaaS de demonstração. Admin Google preparado via SEED_ADMIN_EMAIL=${adminEmail}.`
      : 'Seed concluído: catálogo sem SaaS de demonstração. Nenhum admin criado; defina SEED_ADMIN_EMAIL se precisar preparar uma conta admin para login Google.',
  );
}
void main().finally(async () => prisma.$disconnect());
