const assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {loadUi}=require('./verify-store-webhook-ui.cjs');
function render(snapshot,form=null){
 const states=[snapshot,form,false,'','',[],'events',null];
 const react={...React,useState(initial){return React.useState(states.length?states.shift():initial);}};
 const Component=loadUi('src/app/dashboard/webhooks/WebhookReceivers.tsx',react).default;
 return renderToStaticMarkup(React.createElement(Component));
}
const unavailable=render({available:false,receivers:[],events:[],contacts:[],orders:[]});
assert.match(unavailable,/Recebimento aguardando ativação/);assert.ok(!unavailable.includes('Gerar novo webhook'),'Missing migration is represented without fake active controls');
const ready=render({available:true,receivers:[{id:'receiver',name:'Minha origem',enabled:true,permissions:['events.receive'],url:'https://www.educalizando.com.br/api/webhooks/receive/receiver/private-key'}],events:[{id:'event',receiver_id:'receiver',type:'customer.upsert',status:'processed',is_test:false,created_at:'2026-10-16T13:00:00Z',result:{message:'Cliente recebido'}}],contacts:[],orders:[]},{name:'Minha origem',permissions:['events.receive']});
assert.match(ready,/Copiar webhook/);assert.match(ready,/type="password"/);assert.match(ready,/Verificar link/);assert.match(ready,/Gerar webhook privado/);assert.match(ready,/Cliente recebido/);
assert.ok(!ready.includes('href="https://www.educalizando.com.br/api/webhooks/receive/'),'Private URL is not exposed through an automatically visited link');
assert.match(ready,/não cria contas nem autoriza marketing automaticamente/);
assert.match(ready,/saldo ou cobrança/);
console.log('PASS: receiver UI rendered with real React; pending migration, private link controls, explicit permissions, history and beginner guide. No HTTP sends.');
