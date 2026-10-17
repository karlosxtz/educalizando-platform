const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => mocks[name] || require(name), Response, Request, Headers, AbortController, DOMException, setTimeout, clearTimeout, TypeError, SyntaxError, console, ...globals });
  return exports;
}
const parser = load('src/lib/ai-json.ts');
assert.equal(parser.extractAiJson('```json\n{"nested":{"text":"brace } and \\\"quote"}}\n```').nested.text, 'brace } and "quote');
assert.equal(parser.extractAiJson('{"description":"unfinished'), null);
assert.equal(parser.extractAiJson('[{"title":"array"}]'), null);
assert.equal(parser.extractAiJson('null'), null);
assert.equal(parser.extractAiJson('{"description":"Linha 1\nLinha 2", "tags":["a",],}').description, 'Linha 1\nLinha 2');
assert.equal(parser.extractAiJson('{"description":"vírgula, } preservada"}').description, 'vírgula, } preservada');
const seoResponse = load('src/lib/ai-seo-response.ts', { './ai-json': parser });
assert.deepEqual(Array.from(seoResponse.normalizeSeoResponse({ proposta: { titulo: 'Título gerado', descricao: 'Texto completo' } }, 'Atual').titles), ['Título gerado']);
assert.equal(seoResponse.normalizeSeoResponse({ descriptionOptions: ['Descrição gerada'] }, 'Atual').description, 'Descrição gerada');
assert.equal(seoResponse.normalizeSeoResponse({ description: 'Completa' }, 'Atual').titles[0], 'Atual');
assert.throws(() => seoResponse.normalizeSeoResponse({ titles: ['Título sem descrição'] }, 'Atual'), /formato/);
assert.equal(parser.extractAiJson('Here is JSON: {"title":"complete"} Done.').title, 'complete');
let calls = [], handler;
const provider = load('src/lib/ai-provider.ts', { './ai-json': parser }, {
  fetch: async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return handler(url, init); },
  setTimeout: callback => setTimeout(callback, 30),
});
const chat = (text, reason = 'stop') => Response.json({ choices: [{ message: { content: text }, finish_reason: reason }] });
const groq = { ai_provider: 'alternative', openrouter_ai_key: 'gsk_test' };
(async () => {
  handler = () => chat('```json\n{"description":"14 páginas"}\n```');
  assert.equal(JSON.parse(await provider.generateAiContent(groq, 'test', true)).description, '14 páginas');
  assert.equal(calls.at(-1).body.response_format.type, 'json_object');
  assert.equal(calls.at(-1).body.reasoning_effort, 'low');
  handler = () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'internal', thought: true }, { text: '{"title":"final"}' }] } }] });
  assert.equal(JSON.parse(await provider.generateAiContent({ google_ai_key: 'AIza_test' }, 'test', true)).title, 'final');
  assert.equal(calls.at(-1).body.generationConfig.thinkingConfig.thinkingBudget, 0);
  assert.ok(!calls.at(-1).url.includes('AIza'), 'Keys must not appear in request URLs');
  handler = () => chat('{"title":"router"}');
  await provider.generateAiContent({ ai_provider: 'alternative', openrouter_ai_key: 'sk_test' }, 'test', true);
  assert.equal(calls.at(-1).body.provider.require_parameters, true);
  calls = [];
  handler = () => calls.length === 1 ? new Response('No credits', { status: 402 }) : chat('{"title":"free"}');
  assert.equal(JSON.parse(await provider.generateAiContent({ ai_provider: 'alternative', openrouter_ai_key: 'sk_test' }, 'test', true)).title, 'free');
  assert.equal(calls.length, 2);
  assert.equal(calls.at(-1).body.model, 'openrouter/free');
  assert.equal(calls[0].init.signal, calls[1].init.signal, 'Free fallback shares the total deadline');
  for (const [status, pattern] of [[401, /chave/], [402, /créditos/], [429, /limite/], [503, /indisponível/]]) {
    calls = []; handler = () => new Response('gateway text', { status });
    await assert.rejects(provider.generateAiContent(groq, 'test', true), pattern);
    assert.equal(calls.length, status === 503 ? 2 : 1, 'Only explicit transient refusals get one retry');
  }
  calls = []; handler = () => calls.length === 1 ? new Response('temporary', { status: 503 }) : chat('{\"title\":\"recovered\"}');
  assert.equal(JSON.parse(await provider.generateAiContent(groq, 'test', true)).title, 'recovered');
  assert.equal(calls.length, 2);
  handler = () => chat('', 'stop');
  await assert.rejects(provider.generateAiContent(groq, 'test'), /vazia/);
  handler = () => chat('{"description":"truncated', 'length');
  await assert.rejects(provider.generateAiContent(groq, 'test', true), /incompleta/);
  calls = []; handler = () => calls.length === 1 ? chat('{"description":"truncated', 'length') : chat('{"description":"Completa","titles":["Título completo"]}');
  assert.equal(JSON.parse(await provider.generateAiContent(groq, 'test', true, {recoverTruncation:true})).description,'Completa');
  assert.equal(calls.length,2);assert.equal(calls[0].init.signal,calls[1].init.signal);assert.match(calls[1].body.messages[0].content,/RECUPERAÇÃO/);
  calls=[];handler=()=>chat('{"description":"truncated','length');await assert.rejects(provider.generateAiContent(groq,'test',true,{recoverTruncation:true}),/incompleta/);assert.equal(calls.length,2,'Recovery never loops');
  calls=[];handler=()=> calls.length===1 ? new Response('No credits',{status:402}) : calls.length===2 ? chat('{"description":"truncated','length') : chat('{"description":"free complete"}');
  await provider.generateAiContent({ai_provider:'alternative',openrouter_ai_key:'sk_test'},'test',true,{recoverTruncation:true});assert.equal(calls.at(-1).body.model,'openrouter/free','Recovery preserves the free fallback');
  calls=[];handler=()=>calls.length===1?chat('invalid JSON'):chat('{"whatsapp":"Mensagem completa","instagram":"Legenda completa"}');
  const channels=value=>[value.whatsapp,value.instagram].every(item=>typeof item==='string'&&item.trim());
  assert.equal(JSON.parse(await provider.generateAiContent(groq,'campaign',true,{recoverFormat:true,validateJson:channels})).whatsapp,'Mensagem completa');assert.equal(calls.length,2);
  calls=[];handler=()=>calls.length===1?chat('{"whatsapp":"Só um canal"}'):chat('{"whatsapp":"Completa","instagram":"Completa"}');
  await provider.generateAiContent(groq,'campaign',true,{recoverFormat:true,validateJson:channels});assert.equal(calls.length,2,'A syntactically valid but incomplete contract also recovers');
  calls=[];handler=()=>chat('{"whatsapp":"Só um canal"}');await assert.rejects(provider.generateAiContent(groq,'campaign',true,{recoverFormat:true,validateJson:channels}),/formato/);assert.equal(calls.length,2);
  calls=[];handler=()=>chat('', 'content_filter');await assert.rejects(provider.generateAiContent(groq,'test',true,{recoverFormat:true,recoverTruncation:true}),/Revise/);assert.equal(calls.length,1,'Never retry safety refusals');
  calls=[];handler=()=>calls.length===1?chat('Texto cortado','length'):chat('Resposta completa do assistente.');
  assert.equal(await provider.generateAiContent(groq,'assistant',false,{recoverTruncation:true}),'Resposta completa do assistente.');assert.equal(calls.length,2);assert.equal(calls[0].init.signal,calls[1].init.signal);
  handler = () => chat('not JSON');
  await assert.rejects(provider.generateAiContent(groq, 'test', true), /formato/);
  handler = () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] });
  await assert.rejects(provider.generateAiContent({ google_ai_key: 'AIza_test' }, 'test'), /incompleta/);
  handler = () => Response.json({ promptFeedback: { blockReason: 'SAFETY' } });
  await assert.rejects(provider.generateAiContent({ google_ai_key: 'AIza_test' }, 'test'), /Revise/);
  handler = (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  await assert.rejects(provider.generateAiContent(groq, 'test'), /2 minutos/);
  handler = (_url, init) => ({ ok: true, json: () => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('body aborted')))) });
  await assert.rejects(provider.generateAiContent(groq, 'test'), /2 minutos/, 'Deadline includes response body');
  const responseReader = load('src/lib/api-response.ts');
  const client = load('src/lib/ai-client.ts', { './api-response': responseReader, './client-api': { authenticatedFetch: async () => new Response('Bad gateway', { status: 502 }) } });
  await assert.rejects(client.requestAiJson('/api/ai/product-tools'), /temporariamente indisponível/);
  const pendingClient = load('src/lib/ai-client.ts', { './api-response': responseReader, './client-api': { authenticatedFetch: () => new Promise(() => {}) } }, { setTimeout: callback => setTimeout(callback, 15) });
  await assert.rejects(pendingClient.aiFetch('/api/ai/product-tools'), /demorou demais/, 'An authentication promise must not bypass the deadline');
  const controller = new AbortController();
  const pending = pendingClient.aiFetch('/api/ai/product-tools', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError', 'Cancellation is distinct from provider failure');
  console.log('PASS: JSON modes for all 3 providers, low-latency settings, secret-free URLs, no hidden retries, complete JSON parser, empty/truncated/blocked/quota responses, request and body deadlines, readable gateway errors. No real provider requests.');
})().catch(error => { console.error(error); process.exitCode = 1; });
