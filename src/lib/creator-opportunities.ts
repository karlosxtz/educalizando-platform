import { SCHOOL_CALENDAR_EVENTS } from './school-calendar';

export type OpportunityProduct = { id: string; titulo: string; status: string; seasonal_tags: string[] | null; tags: string[] | null };
export type OpportunityMatch = { product: OpportunityProduct; reason: string; confirmed: boolean };
const DAY = 86400000;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases: Record<string, string[]> = {
  'dia-da-reforma-protestante': ['reforma protestante'],
  'dia-da-consciencia-negra': ['consciencia negra', 'cultura afro brasileira'],
  'dia-dos-povos-indigenas': ['povos indigenas', 'cultura indigena'],
  'meio-ambiente': ['meio ambiente'],
  'dia-do-livro-infantil': ['literatura infantil', 'livro infantil'],
  'abolicao-da-escravidao': ['abolicao da escravidao'],
};

/** UTC day arithmetic over São Paulo civil dates avoids DST and browser-zone drift. */
export function opportunityToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day'));
}
export function opportunityDate(value: number) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(value);
}
export function buildCreatorOpportunities(products: OpportunityProduct[], now = new Date(), leadDays = 21) {
  const today = opportunityToday(now), year = new Date(today).getUTCFullYear();
  const lead = [14, 21, 30, 45].includes(leadDays) ? leadDays : 21;
  return SCHOOL_CALENDAR_EVENTS.map(event => {
    let date = Date.UTC(year, event.month - 1, event.day);
    if (date < today) date = Date.UTC(year + 1, event.month - 1, event.day);
    const daysUntil = Math.round((date - today) / DAY);
    const name = normalize(event.name);
    const core = name.replace(/^\d+ de \w+ /, '').replace(/^dia (internacional |mundial |nacional )?(d[oa]s? )?/, '');
    const phrases = [...new Set([name, ...(core.includes(' ') ? [core] : []), ...(aliases[event.slug] || [])])].filter(term => term.length >= 5);
    const matches: OpportunityMatch[] = products.flatMap(product => {
      const confirmed = (product.seasonal_tags || []).some(tag => normalize(tag) === name);
      if (confirmed) return [{ product, confirmed: true, reason: 'Data marcada no cadastro' }];
      const fields = [product.titulo, ...(product.tags || []), ...(product.seasonal_tags || [])].map(value => ' ' + normalize(value) + ' ');
      const phrase = phrases.find(term => fields.some(field => field.includes(' ' + term + ' ')));
      return phrase ? [{ product, confirmed: false, reason: 'Tema encontrado no título ou nas tags; confira a relação' }] : [];
    }).sort((a, b) => Number(b.confirmed) - Number(a.confirmed) || a.product.titulo.localeCompare(b.product.titulo, 'pt-BR'));
    const start = date - lead * DAY;
    return { event, date, daysUntil, start, matches, phase: daysUntil === 0 ? 'É hoje' : daysUntil <= 7 ? 'Reforce a divulgação' : start <= today ? 'Hora de divulgar' : 'Prepare com antecedência',
      steps: [
        { date: date - (lead + 7) * DAY, title: 'Prepare o material', text: 'Confira capa, descrição, público indicado e link de compra.' },
        { date: start, title: 'Comece a divulgação', text: 'Apresente o material e uma sugestão de uso nas suas redes.' },
        { date: date - 7 * DAY, title: 'Mostre uma prévia', text: 'Compartilhe páginas de exemplo e explique o que está incluído.' },
        { date: date - DAY, title: 'Faça um lembrete', text: 'Reforce o link de compra e esclareça dúvidas, sem criar falsa urgência.' },
      ],
    };
  }).sort((a, b) => a.date - b.date);
}
export type CreatorOpportunity = ReturnType<typeof buildCreatorOpportunities>[number];
