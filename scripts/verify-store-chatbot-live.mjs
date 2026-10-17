import assert from 'node:assert/strict';

const origin = 'https://www.educalizando.com.br';
for (const headers of [{},{Authorization:'Bearer edu_live_'+'invalid'.repeat(7)}]) {
  const response=await fetch(origin+'/api/integrations/store-chatbot',{headers,signal:AbortSignal.timeout(30000)});
  const data=await response.json();
  assert.equal(response.status,401);
  assert.equal(data.code,'INVALID_API_KEY');
  assert.ok(data.requestId);
  assert.equal(response.headers.get('X-Request-ID'),data.requestId);
  assert.match(response.headers.get('Cache-Control'),/private.*no-store/);
}
for(const page of ['/','/login']) {
  const response=await fetch(origin+page,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/Educalizando/i);
  assert.doesNotMatch(html,/A conexão com o banco de dados não está configurada/);
}
console.log('Produção validada: API rejeita credencial ausente/inválida com código e ID; sem cache; homepage e login disponíveis. Nenhuma consulta autenticada real ou mensagem enviada.');
