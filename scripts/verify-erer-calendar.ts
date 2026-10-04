import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getSchoolCalendarEvent, getSchoolCalendarTagsForMonth, SCHOOL_CALENDAR_TAGS } from '../src/lib/school-calendar';

const mayTag = '13 de Maio – Abolição da Escravidão';
assert.ok(SCHOOL_CALENDAR_TAGS.includes(mayTag), '13 de maio precisa estar disponível no cadastro e nos filtros.');
assert.ok(getSchoolCalendarTagsForMonth(4).includes(mayTag), '13 de maio precisa aparecer nas sugestões de maio.');
assert.equal(getSchoolCalendarEvent('abolicao-da-escravidao')?.day, 13, 'O calendário precisa publicar a data em 13 de maio.');

const migration = readFileSync('supabase/migrations/20261003170000_expand_bncc_erer_skills.sql', 'utf8');
for (const code of ['EF05HI20', 'EF06HI19', 'EF69AR01', 'EF69AR34', 'ERER01', 'ERER06']) {
  assert.match(migration, new RegExp(code), `${code} precisa constar na ampliação ERER.`);
}
assert.match(migration, /não integrante da BNCC final vigente/i, 'EF05HI20 precisa ser identificado como referência complementar.');
assert.match(migration, /Educação para as Relações Étnico-Raciais/i, 'A base precisa oferecer o componente ERER.');

console.log('OK: habilidades ERER e 13 de maio estão disponíveis com identificação curricular adequada.');
