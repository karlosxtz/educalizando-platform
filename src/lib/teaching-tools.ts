export const TOOL_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type PlanMaterial={id:string;title:string;plr:boolean};
export type TeachingPlan={id:string;title:string;class_name:string;subject:string;lesson_date:string|null;notes:string;materials:PlanMaterial[]};
export function textField(value:unknown,min:number,max:number,label:string){
  if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw new Error(`Confira ${label} (${min} a ${max} caracteres).`);
  return value.trim();
}
export function planInput(body:Record<string,unknown>){
  const materials=body.materials;
  if(!Array.isArray(materials)||materials.length>30)throw new Error('Use até 30 materiais por planejamento.');
  const seen=new Set<string>();
  const clean=materials.map((m:unknown)=>{
    if(!m||typeof m!=='object')throw new Error('Material inválido.');
    const row=m as Record<string,unknown>;
    if(typeof row.id!=='string'||!TOOL_UUID.test(row.id)||typeof row.plr!=='boolean')throw new Error('Material inválido.');
    const key=row.id+String(row.plr);if(seen.has(key))throw new Error('Material repetido.');seen.add(key);
    return {id:row.id,title:textField(row.title,1,300,'o título do material'),plr:row.plr};
  });
  const date=body.lesson_date;
  if(date!==null&&date!==''&&(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw new Error('Data inválida.');
  return {title:textField(body.title,3,120,'o título'),class_name:textField(body.class_name,0,100,'a turma'),subject:textField(body.subject,0,100,'a disciplina'),lesson_date:date||null,notes:textField(body.notes,0,6000,'as observações'),materials:clean};
}
export const SAVED_FILTER_KEYS=['q','categoria','preco','ano_escolar','idade','disciplina','tema','bncc','formato','cor','filter','data'] as const;
export function savedFilters(value:unknown):Record<string,string>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Busca inválida.');
  const input=value as Record<string,unknown>,output:Record<string,string>={};
  for(const key of SAVED_FILTER_KEYS){if(input[key]===undefined||input[key]==='')continue;output[key]=textField(input[key],1,160,'os filtros');}
  if(!Object.keys(output).length)throw new Error('Escolha um termo ou filtro para salvar.');
  return output;
}
export function pollInput(body:Record<string,unknown>){
  if(!Array.isArray(body.options)||body.options.length<2||body.options.length>5)throw new Error('Informe de 2 a 5 opções.');
  const options=body.options.map(v=>textField(v,1,100,'as opções'));
  if(new Set(options.map(s=>s.toLocaleLowerCase('pt-BR'))).size!==options.length)throw new Error('As opções precisam ser diferentes.');
  const days=Number(body.days);if(!Number.isInteger(days)||days<1||days>30)throw new Error('Escolha de 1 a 30 dias.');
  return {question:textField(body.question,10,240,'a pergunta'),options,closes_at:new Date(Date.now()+days*86400000).toISOString()};
}
export function printingEstimate(students:number,pages:number,copies:number,cost:number,duplex:boolean){
  if(!Number.isInteger(students)||students<1||students>10000||!Number.isInteger(pages)||pages<1||pages>10000||!Number.isInteger(copies)||copies<1||copies>100||!Number.isFinite(cost)||cost<0||cost>1000)return null;
  const impressions=students*pages*copies;
  const sheets=students*copies*(duplex?Math.ceil(pages/2):pages);
  return {impressions,sheets,total:Math.round(impressions*cost*100)/100};
}
