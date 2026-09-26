import { expect, test } from '@playwright/test';

const viewports = [
  { name: '320px', width: 320, height: 700 },
  { name: '360px', width: 360, height: 800 },
  { name: '390px', width: 390, height: 844 },
  { name: '414px', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const publicRoutes = [
  '/', '/buscar', '/buscar?query=inexistente', '/calendario', '/lojas', '/ofertas',
  '/materiais-gratis', '/blog', '/glossario', '/ajuda', '/sobre',
  '/entrar', '/login', '/cadastro', '/produto/slug-inexistente',
  '/loja/loja-inexistente-para-teste', '/carrinho',
];

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const viewport of viewports) {
  test.describe(`rotas públicas em ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of publicRoutes) {
      test(`${route} carrega sem overflow horizontal`, async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (error) => pageErrors.push(error));
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBeLessThan(500);
        await expect(page.locator('body')).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(pageErrors).toEqual([]);
      });
    }
  });
}

test.describe('header mobile público', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('abre, fecha com Escape e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menu = page.getByRole('button', { name: 'Abrir menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'Menu principal' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu principal' })).toBeHidden();
    await expect(menu).toBeFocused();
    await expectNoHorizontalOverflow(page);
  });

  test('mantém busca, carrinho e entrada acessíveis', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Abrir carrinho' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar ou criar conta' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /o que você procura hoje/i }).first()).toBeVisible();
  });
});

test('homepage exibe campanha temática conectada ao calendário', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const campaign = page.locator('[aria-labelledby="tema-em-destaque"]');
  await expect(campaign).toBeVisible();
  await expect(campaign.getByText('Tema em destaque')).toBeVisible();
  await expect(campaign.getByRole('link', { name: /ver no calendário|ver calendário/i })).toBeVisible();
  await expect(campaign.getByRole('link', { name: /explorar materiais|ver material/i })).toBeVisible();
  const visualOrder = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    return {
      campaign: top('[aria-labelledby="tema-em-destaque"]'),
      categories: top('[aria-labelledby="home-categorias"]'),
    };
  });
  expect(visualOrder.campaign).toBeLessThan(visualOrder.categories);
  const featuredProducts = page.getByRole('heading', { name: 'Materiais em destaque' });
  if (await featuredProducts.count()) {
    await expect(featuredProducts).toBeVisible();
    const [campaignTop, productsTop, categoriesTop] = await Promise.all([
      campaign.evaluate((element) => element.getBoundingClientRect().top),
      featuredProducts.evaluate((element) => element.getBoundingClientRect().top),
      page.locator('[aria-labelledby="home-categorias"]').evaluate((element) => element.getBoundingClientRect().top),
    ]);
    expect(campaignTop).toBeLessThan(productsTop);
    expect(productsTop).toBeLessThan(categoriesTop);
  }
  await expectNoHorizontalOverflow(page);
});
