const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props: props || {} });
const code = ts.transpileModule(fs.readFileSync('src/app/dashboard/importar-plataforma/page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function harness() {
  const state = [], effects = [], notifications = [], requests = [];
  let cursor = 0, tree, complete;
  const job = { id: 'job', source_label: 'Loja de teste', status: 'paused', source_total: 116, discovered: 65, imported: 60, skipped: 0, issues: [], asset_cursor: 0 };
  const react = {
    useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return state[index] ||= { current: initial }; },
    useCallback: callback => callback,
    useEffect: effect => { effects.push(effect); },
  };
  const out = {};
  vm.runInNewContext(code, { exports: out, require: name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'next/link') return { default: 'a' };
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => key });
    if (name === 'sonner') return { toast: { success: text => notifications.push(['success', text]), error: text => notifications.push(['error', text]) } };
    if (name.includes('PlatformImportFeedback')) return { PlatformImportFeedback: 'Feedback' };
    if (name.includes('api-response')) return { readApiJson: async response => response.data };
    if (name.includes('client-api')) return { authenticatedFetch: async (_, options) => {
      if (!options) return { ok: true, data: { jobs: [job], available: true, deliveryReady: true, store: { nome_loja: 'Teste' } } };
      requests.push(JSON.parse(options.body));
      return new Promise(resolve => { complete = resolve; });
    } };
    throw new Error(name);
  }, console, Date, AbortController, setTimeout, clearTimeout, Error });
  const render = () => { cursor = 0; tree = out.default(); return tree; };
  const nodes = function* (node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) { for (const child of node) yield* nodes(child); return; } yield node; yield* nodes(node.props?.children); };
  const find = predicate => [...nodes(render())].find(predicate);
  const text = node => !node ? '' : typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  return { requests, notifications, job, flush, find, text,
    async ready() { render(); effects[0](); await flush(); find(node => node.type === 'input').props.onChange({ target: { value: 'private-test-only' } }); },
    click() { find(node => node.type === 'button' && (text(node).includes('Completar arquivos desde o início') || text(node).includes('Preparando conferência'))).props.onClick(); },
    complete: (ok, data) => complete({ ok, data }),
  };
}
(async () => {
  const success = harness(); await success.ready(); success.click(); success.click();
  assert.equal(success.requests.length, 1, 'Bloquear cliques repetidos durante a solicitação');
  assert.match(success.text(success.find(node => node.type === 'button' && node.props['aria-busy'])), /Preparando conferência/);
  assert.match(success.find(node => node.type === 'Feedback').props.notice.text, /Preparando/);
  assert.equal(success.notifications.length, 0, 'Não confirmar início antes da resposta');
  success.complete(true, { job: { ...success.job, status: 'running', discovered: 5, imported: 0 } }); await success.flush();
  const running = success.find(node => node.type === 'Feedback');
  assert.equal(running.props.working, true);
  assert.match(running.props.notice.text, /iniciada/);
  assert.equal(success.notifications[0][0], 'success');
  const failure = harness(); await failure.ready(); failure.click();
  failure.complete(false, { error: 'Não foi possível consultar a origem.' }); await failure.flush();
  const failed = failure.find(node => node.type === 'Feedback');
  assert.equal(failed.props.working, false);
  assert.equal(failed.props.notice.tone, 'error');
  assert.equal(failed.props.notice.text, 'Não foi possível consultar a origem.');
  assert.equal(failure.notifications[0][0], 'error');
  console.log('Importação: retorno imediato, início confirmado, bloqueio de duplo clique e erro local verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });

