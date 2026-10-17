export function takeoverTools() {
  const fingerprint = text => {
    const value=String(text||'').replace(/\r\n/g,'\n').trim();
    let a=2166136261,b=5381;
    for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i);}
    return (a>>>0).toString(16)+(b>>>0).toString(16);
  };
  const keys=(instance,phone,id,text)=>({
    botIdKey:'edu:v20:bot-id:'+instance+':'+id,
    pendingKey:'edu:v20:bot-pending:'+instance+':'+phone+':'+fingerprint(text),
  });
  const human=(input,registeredId,pending,now=Date.now())=>{
    if(!input.ownCandidate||registeredId)return false;
    let marker;try{marker=typeof pending==='string'?JSON.parse(pending):pending;}catch{}
    const explicitHuman=['android','ios','desktop'].includes(input.source);
    const recent=marker&&Number(marker.at)<=now&&now-Number(marker.at)<30000;
    if(!explicitHuman&&recent&&String(marker.text||'').trim()===String(input.texto||'').trim())return false;
    return true;
  };
  const receipt=(response,instance,phone)=>{
    let value=response;
    for(let i=0;i<4&&!value?.key?.id;i++)value=value?.data||value?.body;
    if(!value?.key?.id||value.key.fromMe!==true)throw new Error('O envio não retornou um identificador de mensagem válido.');
    return {...keys(instance,phone,String(value.key.id),''),botId:String(value.key.id)};
  };
  return {fingerprint,keys,human,receipt};
}

export function patchTakeoverInput(code) {
  if(code.includes('ownCandidate,'))throw new Error('Detecção já aplicada');
  return code.replace('if (isRetomar) shouldProcess = true;',
    'if (isRetomar) shouldProcess = true;\nconst source=String(data.source||"unknown").toLowerCase();\nconst stamp=Number(data.messageTimestamp||0);\nconst epoch=stamp>1e12?stamp:stamp*1000;\nconst liveEvent=!epoch || Math.abs(Date.now()-epoch)<300000;\nconst ownCandidate=evento && fromMe && !isRetomar && jidValido && !!phone && tipo!=="ignorar" && liveEvent;\nconst ownKeys=takeoverTools().keys(String(body.instance||""),phone,String(key.id||""),texto);')
    .replace('shouldProcess, instance:', 'fromMe, source, ownCandidate, ...ownKeys, shouldProcess, instance:');
}
