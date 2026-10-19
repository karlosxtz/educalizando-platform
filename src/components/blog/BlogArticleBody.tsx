import Link from 'next/link';

/** Text-only formatting: React escapes all creator content, no raw HTML. */
export default function BlogArticleBody({ content }: { content: string }) {
  return <div className="space-y-5 break-words text-base leading-8 text-slate-700 [overflow-wrap:anywhere]">{content.split(/\n\s*\n/).filter(Boolean).map((block,index)=>{
    if (/^#{1,3}\s/.test(block)) return <h2 key={index} className="pt-3 text-2xl font-bold leading-tight text-slate-950">{block.replace(/^#{1,3}\s+/,'')}</h2>;
    if(block.split('\n').every(line=>/^[-*]\s/.test(line))) return <ul key={index} className="list-disc space-y-2 pl-6">{block.split('\n').map((line,i)=><li key={i}>{line.slice(2)}</li>)}</ul>;
    return <p key={index} className="whitespace-pre-line">{block.split(/(https:\/\/[^\s<>]+)/).map((part,i)=>{
      if (!part.startsWith('https://')) return part;
      try {const url=new URL(part);if(url.username || url.password) return part;return <Link key={i} href={url.href} target="_blank" rel="nofollow ugc noopener noreferrer" className="font-medium text-blue-700 underline">{part}</Link>;}catch{return part;}
    })}</p>;
  })}</div>;
}
