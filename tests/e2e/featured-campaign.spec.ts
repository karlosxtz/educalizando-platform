import { expect, test } from '@playwright/test';

test('campanha alterna, pausa e atualiza o mês automaticamente', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-30T23:59:00-03:00') });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const campaign = page.locator('[aria-labelledby="tema-em-destaque"]');
  const heading = campaign.locator('h2');
  await expect(campaign.getByRole('button', { name: 'Dia da Árvore', exact: true })).toBeVisible();
  const initial = await heading.textContent();
  await campaign.hover();
  await page.clock.runFor(4000);
  const progress = campaign.locator('[data-campaign-progress]');
  await expect(progress).toHaveAttribute('style', /scaleX\(0\.[1-9]/);
  await page.clock.runFor(4100);
  await expect(heading).not.toHaveText(initial!);
  await campaign.getByRole('button', { name: 'Dia da Árvore', exact: true }).click();
  await expect(heading).toHaveText('Dia da Árvore');
  await expect(campaign.getByRole('link', { name: 'Ver no calendário' })).toHaveAttribute('href', '/calendario/dia-da-arvore');
  await page.clock.runFor(8100);
  await expect(heading).not.toHaveText('Dia da Árvore');
  await campaign.getByRole('button', { name: 'Dia da Árvore', exact: true }).click();
  await campaign.getByRole('button', { name: 'Pausar campanhas' }).click();
  await page.clock.runFor(9000);
  await expect(heading).toHaveText('Dia da Árvore');
  await page.clock.setSystemTime(new Date('2026-10-01T00:01:00-03:00'));
  await page.clock.runFor(61000);
  await expect(campaign.getByRole('button', { name: 'Dia das Crianças', exact: true })).toBeVisible();
  await expect(campaign.getByRole('button', { name: 'Dia da Árvore', exact: true })).toHaveCount(0);
});

for (const width of [320, 360, 375, 390, 414, 768, 1024, 1280, 1440]) {
  test(`campanha acessível e sem overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const campaign = page.locator('[aria-labelledby="tema-em-destaque"]');
    await expect(campaign).toBeVisible();
    await expect(campaign.getByRole('button', { name: 'Pausar campanhas' })).toHaveCount(0);
    const initial = await campaign.locator('h2').textContent();
    await campaign.getByRole('button', { name: 'Próxima campanha' }).click();
    await expect(campaign.locator('h2')).not.toHaveText(initial!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
