import type { Product } from './types';
export type CoverProbe = { state:'ok'|'broken'|'unverified'; bytes:number|null; reason?:string };
export type HealthIssue = { level:'error'|'suggestion'|'notice'; text:string };
export function materialHealthIssues(p:Partial<Product>,cover:CoverProbe):HealthIssue[] {
  const issues:HealthIssue[]=[];
  if(!p.capa_url)issues.push({level:'error',text:'Adicione uma capa ao material.'});
  else if(cover.state==='broken')issues.push({level:'error',text:'A capa retornou erro ou não é uma imagem. Reenvie a capa e confira a vitrine.'});
  else if(cover.state==='unverified')issues.push({level:'notice',text:cover.reason||'Não foi possível verificar a capa agora. Isso não confirma que esteja quebrada.'});
  if(cover.bytes&&cover.bytes>500*1024)issues.push({level:'suggestion',text:`Capa com ${(cover.bytes/1024/1024).toFixed(1)} MB. Considere uma versão mais leve, mantendo a legibilidade.`});
  if(!p.titulo?.trim())issues.push({level:'error',text:'Preencha o título.'});
  if(!p.descricao||p.descricao.trim().length<80)issues.push({level:'suggestion',text:'Explique o conteúdo incluído e como usar em uma descrição mais completa.'});
  if(!p.preview_url&&(p.images?.length||0)<2)issues.push({level:'suggestion',text:'Adicione uma prévia pública ou mais fotos internas à galeria.'});
  if(!p.category_id&&!p.category_ids?.length)issues.push({level:'suggestion',text:'Escolha uma categoria para facilitar a descoberta.'});
  if(!p.education_level_id&&!p.education_level_ids?.length)issues.push({level:'suggestion',text:'Informe a etapa de ensino indicada.'});
  if(!p.age_range?.trim())issues.push({level:'suggestion',text:'Informe a faixa etária ou o ano indicado, quando aplicável.'});
  if(!p.format_details?.trim())issues.push({level:'suggestion',text:'Explique formato, impressão e uso do arquivo.'});
  return issues;
}
export function healthCoverUrl(value:unknown):string|null {
  if(typeof value!=='string')return null;
  try {const u=new URL(value);return u.protocol==='https:'&&u.hostname==='arquivos.educalizando.com.br'&&!u.port&&!u.username&&!u.password&&u.pathname.startsWith('/public-images/')&&!u.search&&!u.hash?u.href:null;}catch{return null;}
}
/** Only HEAD on public MinIO covers; no redirects, private files or third-party URLs. */
export async function probePublicCover(value:unknown,fetcher:typeof fetch=fetch):Promise<CoverProbe> {
  const url=healthCoverUrl(value);if(!url)return {state:'unverified',bytes:null,reason:'Verificação automática disponível para capas públicas da estrutura de arquivos. Confira esta referência na vitrine.'};
  try {
    const r=await fetcher(url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(4000)});
    if([404,410].includes(r.status))return {state:'broken',bytes:null};
    if(!r.ok)return {state:'unverified',bytes:null};
    const mime=r.headers.get('content-type')||'';
    if(mime&&!mime.startsWith('image/'))return {state:'broken',bytes:null};
    if(!mime)return {state:'unverified',bytes:null};
    const bytes=Number(r.headers.get('content-length'));
    return {state:'ok',bytes:Number.isFinite(bytes)&&bytes>0?bytes:null};
  }catch{return {state:'unverified',bytes:null};}
}
