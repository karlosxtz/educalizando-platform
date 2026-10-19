'use client';
import { presentationVideo } from '@/lib/presentation-video';
import PresentationVideoPlayer from '@/components/PresentationVideoPlayer';

export default function ProductVideoFields({ url, onChange, asCover, onCoverChange, cover }: {
  url: string; onChange: (value: string) => void; asCover: boolean; onCoverChange: (value: boolean) => void; cover?: string;
}) {
  const video = presentationVideo(url);
  return <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5" aria-labelledby="product-presentation-video">
    <h3 id="product-presentation-video" className="text-lg font-bold text-violet-950">Mostre seu material em ação</h3>
    <p className="mt-2 text-sm leading-6 text-violet-800">Cole um vídeo público do YouTube, Shorts ou Instagram para apresentar o material. O vídeo é uma demonstração; a entrega dos arquivos continua separada.</p>
    <label htmlFor="presentation-video-url" className="mt-4 block text-sm font-semibold text-slate-800">Link de apresentação</label>
    <input id="presentation-video-url" type="url" value={url} onChange={event => onChange(event.target.value)} placeholder="https://www.youtube.com/watch?v=... ou https://www.instagram.com/reel/..." className="mt-2 min-h-12 w-full rounded-xl border border-violet-200 bg-white px-4 text-sm text-slate-900" aria-describedby="presentation-video-help" />
    <p id="presentation-video-help" className={`mt-2 text-xs leading-5 ${url && !video ? 'text-rose-700' : 'text-violet-800'}`}>{url && !video ? 'Use um link público válido de vídeo do YouTube ou post/Reel do Instagram.' : 'Mantenha também uma capa em imagem. Ela aparece antes da reprodução e quando o provedor não permite incorporar o vídeo.'}</p>
    <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-violet-200 bg-white p-4"><input type="checkbox" checked={asCover} onChange={event => onCoverChange(event.target.checked)} disabled={!video} className="mt-1 h-4 w-4" /><span className="text-sm text-slate-800"><strong>Usar vídeo como capa na vitrine</strong><span className="mt-1 block text-xs leading-5 text-slate-500">YouTube: prévia silenciosa ao passar o mouse. No celular e no Instagram, use o botão para assistir. Vídeos públicos também aparecem em Vídeos de professores.</span></span></label>
    {video && <div className="mt-4 max-w-sm"><p className="mb-2 text-xs font-bold text-violet-900">Teste sua prévia</p><PresentationVideoPlayer url={video.url} title="Prévia do cadastro" hoverPreview={asCover} className="aspect-video rounded-xl bg-slate-900"><div className="flex h-full items-center justify-center p-5 text-center text-sm text-white">{cover ? 'Sua imagem será mantida como alternativa na vitrine.' : 'Adicione também uma imagem de capa acima.'}</div></PresentationVideoPlayer></div>}
  </section>;
}
