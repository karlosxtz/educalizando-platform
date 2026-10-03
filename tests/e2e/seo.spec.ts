import { expect, test } from '@playwright/test';

const siteUrl = 'https://www.educalizando.com.br';
const socialImagePath = '/branding/logo-og.png?v=3';

test('homepage entrega metadata, imagem social, H1 único e JSON-LD', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Materiais Didáticos Digitais para Professores | Educalizando');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Encontre materiais didáticos digitais, atividades pedagógicas, apostilas, planos de aula e jogos educativos criados por professores.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', siteUrl);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${siteUrl}${socialImagePath}`);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', `${siteUrl}${socialImagePath}`);
  await expect(page.locator('h1')).toHaveCount(1);

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const schemas = jsonLd.map((value) => JSON.parse(value));
  const website = schemas.find((schema) => schema['@type'] === 'WebSite');
  expect(website).toMatchObject({ name: 'Educalizando', url: `${siteUrl}/` });
  expect(website.alternateName).toContain('Educalizando Plataforma Digital');
  expect(schemas.some((schema) => schema['@type'] === 'Organization')).toBe(true);
});

test('páginas de calendário têm metadata exclusiva e dados estruturados', async ({ page }) => {
  await page.goto('/calendario/dia-da-arvore', { waitUntil: 'domcontentloaded' });
  const firstTitle = await page.title();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${siteUrl}/calendario/dia-da-arvore`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${siteUrl}${socialImagePath}`);
  const firstSchemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(firstSchemas.some((value) => value.includes('BreadcrumbList'))).toBe(true);
  expect(firstSchemas.some((value) => value.includes('WebPage'))).toBe(true);
  const firstDescription = await page.locator('meta[name="description"]').getAttribute('content');

  await page.goto('/calendario/independencia-do-brasil', { waitUntil: 'domcontentloaded' });
  expect(await page.title()).not.toBe(firstTitle);
  const secondDescription = await page.locator('meta[name="description"]').getAttribute('content');
  expect(secondDescription).toBeTruthy();
  expect(secondDescription).not.toBe(firstDescription);
});

test('sitemap não repete URLs nem publica rotas privadas', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls.length).toBeGreaterThan(10);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls).toContain(siteUrl);
  expect(urls).toContain(`${siteUrl}/calendario`);
  expect(urls).toContain(`${siteUrl}/blog`);
  expect(urls).toContain(`${siteUrl}/atividades-por-ano`);
  expect(urls.some((url) => /\/(admin|dashboard|cliente|aluno|api|checkout)(\/|$)/.test(new URL(url).pathname))).toBe(false);
});

test('robots mantém áreas privadas bloqueadas para crawlers gerais e Googlebot', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('Sitemap: https://www.educalizando.com.br/sitemap.xml');
  for (const path of ['/admin/', '/dashboard/', '/cliente/', '/aluno/', '/api/', '/checkout/']) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).toMatch(/User-Agent: Googlebot[\s\S]*?Disallow: \/dashboard\//i);
  expect(body).toMatch(/User-Agent: Googlebot[\s\S]*?Allow: \/api\/storage\/public-image/i);
});

test('asset social existe no build público e tem conteúdo', async ({ request }) => {
  const response = await request.get(socialImagePath);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  expect((await response.body()).byteLength).toBeGreaterThan(10_000);
});
