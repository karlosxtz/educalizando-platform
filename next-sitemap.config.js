// next-sitemap loads this configuration as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

const SITE_URL = 'https://www.educalizando.com.br';

const REQUIRED_PUBLIC_PATHS = [
  '/ajuda',
  '/atividades-ensino-fundamental',
  '/atividades-para-imprimir',
  '/atividades-por-ano/ensino-fundamental-1',
  '/atividades-por-ano/ensino-fundamental-2',
  '/atividades-por-ano/ensino-medio',
  '/atividades-por-ano/idiomas-cursos-livres',
  '/atividades-por-ano/pre-vestibular-enem',
  '/cadastro/produtor',
  '/calendario',
  '/vender',
];

// Crawl rules are intentionally narrower than sitemap exclusions.
const ROBOTS_DISALLOW = [
  '/admin/',
  '/dashboard/',
  '/cliente/',
  '/api/',
  '/checkout/',
  '/loja/*/checkout/',
  '/aluno/login',
  '/aluno/painel/',
  '/aluno/dashboard/',
];

const PRIVATE_PATHS = [
  '/admin',
  '/admin/*',
  '/painel',
  '/painel/*',
  '/dashboard',
  '/dashboard/*',
  '/afiliados/login',
  '/aluno',
  '/aluno/arquivos/*',
  '/aluno/brindes',
  '/aluno/brindes/*',
  '/aluno/clubes',
  '/aluno/clubes/*',
  '/aluno/conta',
  '/aluno/dashboard',
  '/aluno/login',
  '/aluno/loja/*',
  '/aluno/materiais-exclusivos',
  '/aluno/materiais/*',
  '/login',
  '/entrar',
  '/api/*',
];

const CALENDAR_SLUGS = [
  'dia-internacional-da-mulher',
  'dia-da-escola',
  'dia-mundial-da-agua',
  'dia-mundial-da-saude',
  'dia-do-livro-infantil',
  'dia-dos-povos-indigenas',
  'dia-da-terra',
  'dia-do-trabalho',
  'abolicao-da-escravidao',
  'meio-ambiente',
  'festa-junina',
  'dia-do-folclore',
  'independencia-do-brasil',
  'dia-da-arvore',
  'primavera',
  'dia-do-transito',
  'dia-das-criancas',
  'dia-dos-professores',
  'proclamacao-da-republica',
  'dia-da-bandeira',
  'dia-da-consciencia-negra',
  'natal',
];

const FALLBACK_DISCIPLINE_SLUGS = [
  'arte',
  'ciencias',
  'educacao-fisica',
  'ensino-religioso',
  'geografia',
  'historia',
  'lingua-inglesa',
  'lingua-portuguesa',
  'matematica',
];

function asIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function addPath(paths, entry) {
  if (!entry?.loc || entry.loc.includes('[')) return;
  paths.set(entry.loc, entry);
}

async function readRows(label, query) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`[next-sitemap] ${label} não pôde ser carregado: ${error.message}`);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn(`[next-sitemap] ${label} não pôde ser carregado: ${error.message}`);
    return [];
  }
}

async function getSupabasePaths() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
    console.warn('[next-sitemap] Supabase não configurado; gerando apenas as rotas estáticas.');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();
  const [products, stores, categories, educationLevels, blogPosts, skills] =
    await Promise.all([
      readRows(
        'produtos',
        supabase
          .from('products')
          .select('id,slug,capa_url,category_id,category_ids,education_level_id,education_level_ids,created_at,updated_at')
          .eq('status', 'publicado')
          .is('excluido_em', null)
          .order('created_at', { ascending: false })
          .limit(5000),
      ),
      readRows(
        'lojas',
        supabase
          .from('stores')
          .select('slug,created_at,updated_at')
          .neq('slug', 'eduardoadmin')
          .limit(5000),
      ),
      readRows(
        'categorias',
        supabase
          .from('categories')
          .select('id,slug,created_at')
          .is('store_id', null)
          .limit(5000),
      ),
      readRows(
        'níveis de ensino',
        supabase
          .from('education_levels')
          .select('id,slug,created_at')
          .limit(5000),
      ),
      readRows(
        'posts do blog',
        supabase
          .from('blog_posts')
          .select('slug,published_at,created_at,updated_at')
          .eq('status', 'published')
          .lte('published_at', now)
          .limit(5000),
      ),
      readRows(
        'disciplinas',
        supabase.from('bncc_skills').select('subject').not('subject', 'is', null).limit(5000),
      ),
    ]);

  const paths = new Map();
  const categoryIds = new Set(
    products.flatMap((product) =>
      product.category_ids?.length
        ? product.category_ids
        : product.category_id
          ? [product.category_id]
          : [],
    ),
  );
  const educationLevelIds = new Set(
    products.flatMap((product) =>
      product.education_level_ids?.length
        ? product.education_level_ids
        : product.education_level_id
          ? [product.education_level_id]
          : [],
    ),
  );

  products.forEach((product) => {
    const slug = product.slug || product.id;
    if (!slug) return;
    addPath(paths, {
      loc: `/produto/${slug}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: asIsoDate(product.updated_at || product.created_at),
      ...(product.capa_url
        ? { images: [{ loc: `${SITE_URL}/imagens/produtos/${encodeURIComponent(slug)}/capa` }] }
        : {}),
    });
  });

  stores.forEach((store) => {
    if (!store.slug) return;
    addPath(paths, {
      loc: `/loja/${store.slug}`,
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: asIsoDate(store.updated_at || store.created_at),
    });
  });

  categories
    .filter((category) => category.slug && categoryIds.has(category.id))
    .forEach((category) =>
      addPath(paths, {
        loc: `/categorias/${category.slug}`,
        changefreq: 'weekly',
        priority: 0.75,
        lastmod: asIsoDate(category.created_at),
      }),
    );

  educationLevels
    .filter((level) => level.slug && educationLevelIds.has(level.id))
    .forEach((level) =>
      addPath(paths, {
        loc: `/atividades-por-ano/${level.slug}`,
        changefreq: 'weekly',
        priority: 0.75,
        lastmod: asIsoDate(level.created_at),
      }),
    );

  blogPosts.forEach((post) => {
    if (!post.slug) return;
    addPath(paths, {
      loc: `/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: 0.65,
      lastmod: asIsoDate(post.updated_at || post.published_at || post.created_at),
    });
  });

  new Set(skills.map((skill) => slugify(skill.subject)).filter(Boolean)).forEach((slug) =>
    addPath(paths, {
      loc: `/disciplinas/${slug}`,
      changefreq: 'weekly',
      priority: 0.75,
      lastmod: now,
    }),
  );

  return [...paths.values()];
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  trailingSlash: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: PRIVATE_PATHS,
  transform: async (config, path) => {
    if (path.includes('[')) return null;

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === '/' ? 1 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  additionalPaths: async () => {
    const editorialPaths = [
      ...REQUIRED_PUBLIC_PATHS.map((loc) => ({
        loc,
        changefreq: 'weekly',
        priority: 0.7,
      })),
      ...CALENDAR_SLUGS.map((slug) => ({
        loc: `/calendario/${slug}`,
        changefreq: 'yearly',
        priority: 0.55,
      })),
      ...FALLBACK_DISCIPLINE_SLUGS.map((slug) => ({
        loc: `/disciplinas/${slug}`,
        changefreq: 'weekly',
        priority: 0.75,
      })),
    ];

    return [...editorialPaths, ...(await getSupabasePaths())];
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ROBOTS_DISALLOW,
      },
    ],
    transformRobotsTxt: async () => [
      'User-agent: *',
      'Allow: /',
      ...ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`),
      '',
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      '',
    ].join('\n'),
  },
};
