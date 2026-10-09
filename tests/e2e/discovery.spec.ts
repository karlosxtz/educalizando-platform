import { expect, test, devices } from '@playwright/test';

for (const name of ['Pixel 7', 'iPhone 13'] as const) {
  test.describe(`descoberta em ${name}`, () => {
    const { defaultBrowserType: _browser, ...device } = devices[name];
    test.use(device);
    test('combina filtros e mantém histórico de busca', async ({ page }) => {
      await page.goto('/buscar');
      await page.getByRole('button', { name: /filtros/i }).first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('Idade recomendada').selectOption('6');
      await dialog.getByLabel('Código BNCC').fill('EF01LP01');
      await dialog.getByLabel('Cores do material').selectOption('preto_e_branco');
      await dialog.getByRole('button', { name: 'Aplicar filtros' }).click();
      await expect(page).toHaveURL(/idade=6/);
      await expect(page).toHaveURL(/bncc=EF01LP01/);
      await page.getByLabel('Buscar materiais', { exact: true }).fill('alfabetizacao');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Buscas recentes' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}
