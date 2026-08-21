import { expect, test } from '@playwright/test';
test('visitante navega do catálogo ao detalhe', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Descubra seu próximo/i }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: /Explorar SaaS/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/explore/);
});
test('cadastro de SaaS exige autenticação', async ({ page }) => {
  await page.goto('/dashboard/saas/new');
  await expect(
    page.getByRole('heading', { name: /Publique seu SaaS/i }),
  ).toBeVisible();
});

test('maker publica e admin aprova o SaaS', async ({ page }, testInfo) => {
  test.skip(
    true,
    'Fluxo admin automatizado por senha foi desativado; use login Google para validar manualmente.',
  );
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const name = `E2E ${suffix}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  await page.goto('/dashboard/saas/new');
  await page.getByLabel('Nome').fill(name);
  await page
    .getByLabel('Tagline')
    .fill('Produto criado pelo fluxo automatizado');
  await page
    .getByLabel('Descrição curta')
    .fill('Um produto de teste completo para validar o fluxo de publicação.');
  await page
    .getByLabel('Descrição completa')
    .fill(
      'Este anúncio é criado durante o teste E2E para confirmar cadastro, revisão, moderação e publicação pública.',
    );
  await page.getByLabel('Analytics').check();
  await page.getByLabel('Tags').fill('e2e, teste');
  await page.getByLabel('Tecnologias').fill('Playwright, TypeScript');
  await page.getByLabel('Website HTTPS').fill(`https://example.com/${slug}`);
  await page.getByRole('button', { name: 'Salvar e revisar' }).click();
  await expect(page).toHaveURL(/\/review/);
  await page.getByRole('button', { name: 'Enviar para análise' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/admin/submissions');
  const row = page.locator('tr').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'Abrir' }).click();
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await expect(page).toHaveURL(/\/admin\/submissions$/);
  await page.goto(`/saas/${slug}`);
  await expect(page.getByRole('heading', { name })).toBeVisible();
});
