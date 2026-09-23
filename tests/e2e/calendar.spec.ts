import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const viewport of [
  { name: '320px', width: 320, height: 700 },
  { name: '360px', width: 360, height: 800 },
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
  { name: '414px', width: 414, height: 896 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 900 },
  { name: '1280px', width: 1280, height: 900 },
]) {
  test.describe(`calendário público em ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('exibe título, navegação mensal e datas acessíveis', async ({ page }) => {
      await page.goto('/calendario?mes=8&ano=2026', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /calendário escolar e datas comemorativas/i })).toBeVisible();
      await expect(page.getByRole('grid', { name: /calendário de setembro de 2026/i })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /7 de setembro: independência do brasil/i })).toBeVisible();
      await page.getByRole('link', { name: /ver outubro de 2026/i }).click();
      await expect(page.getByRole('heading', { name: /outubro de 2026/i })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });
}

test('detalhe do calendário é acessível e slug inexistente retorna 404', async ({ page }) => {
  await page.goto('/calendario/dia-da-arvore', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Dia da Árvore' })).toBeVisible();
  await expect(page.getByRole('link', { name: /buscar materiais para dia da árvore/i })).toBeVisible();
  await page.goto('/calendario/data-inexistente', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /página ou material não encontrado/i })).toBeVisible();
});
