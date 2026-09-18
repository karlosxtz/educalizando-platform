'use client';

import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import { Download, FileArchive, FileImage, FileOutput, FileText, Grid2X2, ImageDown, ImagePlus, Maximize2, QrCode, RotateCw, Scissors, ShieldCheck, Upload, Zap } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { degrees, PDFDocument } from 'pdf-lib';

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};
const asPdf = (data: Uint8Array) => new Blob([data.slice().buffer], { type: 'application/pdf' });

function UploadButton({ label, accept, multiple, onChange }: { label: string; accept?: string; multiple?: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <><input ref={input} className="hidden" type="file" accept={accept} multiple={multiple} onChange={onChange} /><button type="button" onClick={() => input.current?.click()} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 text-xs font-black text-white shadow-md transition hover:bg-blue-800"><Upload className="h-4 w-4" />{label}</button></>;
}

function ToolCard({ title, description, icon, children, wide = false }: { title: string; description: string; icon: ReactNode; children: ReactNode; wide?: boolean }) {
  return <article className={`${wide ? 'lg:col-span-2' : ''} flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-lg`}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand-navy">{icon}</div><h2 className="mt-4 text-lg font-black text-slate-900">{title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p><div className="mt-auto">{children}</div></article>;
}

function HowTo({ steps, note }: { steps: string[]; note?: string }) {
  return <details className="mt-5 border-t border-slate-100 pt-4 text-sm"><summary className="cursor-pointer font-black text-brand-navy">Como usar esta ferramenta</summary><ol className="mt-3 space-y-2 text-slate-600">{steps.map((step, index) => <li key={step} className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[10px] font-black text-white">{index + 1}</span><span>{step}</span></li>)}</ol>{note && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{note}</p>}</details>;
}

export default function CreatorToolsPage() {
  const [notice, setNotice] = useState('');
  const [qrText, setQrText] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [rotationFile, setRotationFile] = useState<File | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState<90 | 180 | 270>(90);
  const [resizeWidth, setResizeWidth] = useState(1080);
  const [resizeFormat, setResizeFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [panelColumns, setPanelColumns] = useState(1);
  const [panelRows, setPanelRows] = useState(4);
  const rotationInput = useRef<HTMLInputElement>(null);

  const optimizeImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { setNotice('Otimizando imagem…'); const result = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 2000, fileType: 'image/webp', useWebWorker: true }); download(result, `${file.name.replace(/\.[^.]+$/, '')}.webp`); setNotice('Imagem otimizada e convertida para WebP.'); } catch { setNotice('Não foi possível processar esta imagem.'); }
  };
  const processPdf = async (event: ChangeEvent<HTMLInputElement>, action: 'join' | 'split') => {
    const files = Array.from(event.target.files || []); if (!files.length) return;
    try {
      setNotice('Processando PDF…');
      if (action === 'join') { const output = await PDFDocument.create(); for (const file of files) { const source = await PDFDocument.load(await file.arrayBuffer()); (await output.copyPages(source, source.getPageIndices())).forEach((page) => output.addPage(page)); } download(asPdf(await output.save()), 'pdf-unido.pdf'); }
      else { const source = await PDFDocument.load(await files[0].arrayBuffer()); for (let index = 0; index < source.getPageCount(); index++) { const output = await PDFDocument.create(); output.addPage((await output.copyPages(source, [index]))[0]); download(asPdf(await output.save()), `pagina-${index + 1}.pdf`); } }
      setNotice('Arquivo pronto para baixar.');
    } catch { setNotice('Não foi possível processar este PDF.'); }
  };
  const rotatePdf = async () => {
    if (!rotationFile) return;
    try { setNotice('Girando PDF…'); const source = await PDFDocument.load(await rotationFile.arrayBuffer()); source.getPages().forEach((page) => page.setRotation(degrees(page.getRotation().angle + rotationDegrees))); download(asPdf(await source.save()), `${rotationFile.name.replace(/\.pdf$/i, '')}-girado-${rotationDegrees}.pdf`); setNotice(`PDF girado em ${rotationDegrees}° e pronto para baixar.`); } catch { setNotice('Não foi possível girar este PDF.'); }
  };
  const compressPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { setNotice('Otimizando a estrutura do PDF…'); const source = await PDFDocument.load(await file.arrayBuffer()); download(asPdf(await source.save({ useObjectStreams: true })), `${file.name.replace(/\.pdf$/i, '')}-otimizado.pdf`); setNotice('PDF otimizado e pronto para baixar.'); } catch { setNotice('Não foi possível otimizar este PDF.'); }
  };
  const createZip = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); if (!files.length) return;
    const zip = new JSZip(); files.forEach((file) => zip.file(file.name, file)); download(await zip.generateAsync({ type: 'blob' }), 'materiais-educalizando.zip'); setNotice('Arquivo ZIP criado com sucesso.');
  };
  const createCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const source = String(reader.result); setCoverPreview(source); const image = new Image(); image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1080; const context = canvas.getContext('2d'); if (!context) return; const scale = Math.max(1080 / image.width, 1080 / image.height); const width = image.width * scale; const height = image.height * scale; context.drawImage(image, (1080 - width) / 2, (1080 - height) / 2, width, height); canvas.toBlob((blob) => blob && download(blob, 'capa-educalizando-1080x1080.jpg'), 'image/jpeg', .92); setNotice('Capa criada em 1080 × 1080.'); }; image.src = source; };
    reader.readAsDataURL(file);
  };
  const fileToImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); const url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem inválida')); }; image.src = url; });
  const imageToCanvas = async (file: File, width?: number, height?: number) => { const image = await fileToImage(file); const canvas = document.createElement('canvas'); canvas.width = width || image.width; canvas.height = height || image.height; const context = canvas.getContext('2d'); if (!context) throw new Error('canvas indisponível'); context.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas; };
  const convertImagesToPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); if (!files.length) return;
    try { setNotice('Criando seu PDF…'); const pdf = await PDFDocument.create(); for (const file of files) { const canvas = await imageToCanvas(file); const image = await pdf.embedJpg(canvas.toDataURL('image/jpeg', .92)); const page = pdf.addPage([595.28, 841.89]); const scale = Math.min((page.getWidth() - 40) / image.width, (page.getHeight() - 40) / image.height); page.drawImage(image, { x: (page.getWidth() - image.width * scale) / 2, y: (page.getHeight() - image.height * scale) / 2, width: image.width * scale, height: image.height * scale }); } download(asPdf(await pdf.save()), 'imagens-educalizando.pdf'); setNotice('PDF criado e pronto para baixar.'); } catch { setNotice('Não foi possível transformar estas imagens em PDF.'); }
  };
  const resizeAndConvert = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); if (!files.length) return;
    try { setNotice('Redimensionando imagens…'); for (const file of files) { const image = await fileToImage(file); const width = Math.min(resizeWidth, image.width); const height = Math.round(image.height * (width / image.width)); const canvas = await imageToCanvas(file, width, height); const extension = resizeFormat === 'image/png' ? 'png' : resizeFormat === 'image/webp' ? 'webp' : 'jpg'; const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, resizeFormat, .92)); if (blob) download(blob, `${file.name.replace(/\.[^.]+$/, '')}-${width}px.${extension}`); } setNotice('Imagem(ns) redimensionada(s) e pronta(s) para baixar.'); } catch { setNotice('Não foi possível redimensionar esta imagem.'); }
  };
  const cropImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const image = await fileToImage(file); const side = Math.min(image.width, image.height); const canvas = document.createElement('canvas'); canvas.width = canvas.height = side; const context = canvas.getContext('2d'); if (!context) return; context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, side, side); const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', .92)); if (blob) download(blob, `${file.name.replace(/\.[^.]+$/, '')}-corte-quadrado.jpg`); setNotice('Imagem cortada no formato quadrado e pronta para baixar.'); } catch { setNotice('Não foi possível cortar esta imagem.'); }
  };
  const createPanel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { setNotice('Montando painel em folhas A4…'); const image = await fileToImage(file); const pdf = await PDFDocument.create(); const canvas = await imageToCanvas(file); const pageWidth = 595.28; const pageHeight = 841.89; for (let row = 0; row < panelRows; row++) for (let column = 0; column < panelColumns; column++) { const part = document.createElement('canvas'); part.width = Math.ceil(image.width / panelColumns); part.height = Math.ceil(image.height / panelRows); const context = part.getContext('2d'); if (!context) continue; context.drawImage(canvas, column * part.width, row * part.height, part.width, part.height, 0, 0, part.width, part.height); const piece = await pdf.embedJpg(part.toDataURL('image/jpeg', .92)); const page = pdf.addPage([pageWidth, pageHeight]); const scale = Math.max(pageWidth / piece.width, pageHeight / piece.height); page.drawImage(piece, { x: (pageWidth - piece.width * scale) / 2, y: (pageHeight - piece.height * scale) / 2, width: piece.width * scale, height: piece.height * scale }); } download(asPdf(await pdf.save()), 'painel-a4-educalizando.pdf'); setNotice(`Painel com ${panelColumns * panelRows} folha(s) A4 pronto para baixar.`); } catch { setNotice('Não foi possível criar este painel.'); }
  };

  return <div className="mx-auto w-full max-w-5xl space-y-7 pb-16">
    <section className="rounded-3xl bg-gradient-to-br from-[#062d63] via-[#084d9f] to-[#0e83d3] p-7 text-white"><Zap className="mb-3 h-6 w-6 text-amber-300" /><h1 className="text-3xl font-black">Caixa de Ferramentas</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">Ferramentas para preparar seus materiais. Os arquivos são processados no seu próprio dispositivo.</p></section>
    {notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">✓ {notice}</p>}
    <div><h2 className="text-xl font-black text-slate-900">Organize seus arquivos</h2><p className="mt-1 text-sm text-slate-500">Escolha uma ação por vez para resultados mais precisos.</p></div>
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ToolCard title="Otimizar imagem" description="Comprime, redimensiona e converte imagens para WebP." icon={<FileImage className="h-6 w-6" />}><UploadButton label="Selecionar imagem" accept="image/*,.heic" onChange={optimizeImage} /></ToolCard>
      <ToolCard title="Unir PDFs" description="Junte vários PDFs em um único material." icon={<FileText className="h-6 w-6" />}><UploadButton label="Selecionar PDFs para unir" accept="application/pdf" multiple onChange={(event) => processPdf(event, 'join')} /></ToolCard>
      <ToolCard title="Dividir PDF" description="Baixe cada página do PDF em um arquivo separado." icon={<Scissors className="h-6 w-6" />}><UploadButton label="Selecionar PDF para dividir" accept="application/pdf" onChange={(event) => processPdf(event, 'split')} /></ToolCard>
      <ToolCard title="Girar PDF" description="Escolha o PDF, defina o ângulo e baixe a versão girada." icon={<RotateCw className="h-6 w-6" />}>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck className="h-4 w-4 text-teal-500" />Seu PDF fica no seu aparelho e não é enviado à internet.</p>
          <input ref={rotationInput} className="hidden" type="file" accept="application/pdf" onChange={(event) => setRotationFile(event.target.files?.[0] || null)} />
          <button type="button" onClick={() => rotationInput.current?.click()} className="mt-4 flex min-h-16 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-white px-4 text-sm font-black text-brand-navy transition hover:border-blue-500 hover:bg-blue-50"><Upload className="h-5 w-5 text-teal-500" />{rotationFile ? rotationFile.name : 'Escolha o PDF'}</button>
          <div className="mt-4 flex flex-wrap gap-2">{([90, 180, 270] as const).map((angle) => <button key={angle} type="button" aria-pressed={rotationDegrees === angle} onClick={() => setRotationDegrees(angle)} className={`min-h-10 rounded-lg px-4 text-sm font-black transition ${rotationDegrees === angle ? 'bg-teal-500 text-white shadow-sm' : 'border border-teal-500 bg-white text-teal-600 hover:bg-teal-50'}`}>Girar {angle}°</button>)}</div>
          <button type="button" disabled={!rotationFile} onClick={rotatePdf} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 text-sm font-black text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"><RotateCw className="h-4 w-4" />Girar e baixar</button>
        </div>
      </ToolCard>
      <ToolCard title="Otimizar PDF" description="Reduz a estrutura interna do PDF para facilitar o envio e armazenamento." icon={<ImageDown className="h-6 w-6" />}><UploadButton label="Selecionar PDF para otimizar" accept="application/pdf" onChange={compressPdf} /><HowTo steps={['Selecione o PDF final do seu material.', 'A ferramenta otimiza a estrutura do arquivo.', 'Baixe e confira a nova versão antes de enviar ao cliente.']} note="PDFs com fotos muito grandes podem continuar pesados. Para reduzir imagens, otimize-as antes de criar o PDF." /></ToolCard>
      <ToolCard wide title="Criar arquivo ZIP" description="Compacte vários materiais de uma só vez. Use para enviar arquivos organizados aos seus clientes." icon={<FileArchive className="h-6 w-6" />}><UploadButton label="Selecionar arquivos para compactar" multiple onChange={createZip} /></ToolCard>
    </section>
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ToolCard title="Capa 1:1 para produto" description="Envie sua imagem e receba uma capa centralizada em 1080 × 1080, ideal para a loja no mobile e PC." icon={<ImagePlus className="h-6 w-6" />}>{coverPreview && <img src={coverPreview} alt="Prévia da capa" className="mt-4 h-36 w-36 rounded-2xl object-cover" />}<UploadButton label="Enviar imagem e criar capa" accept="image/*,.heic" onChange={createCover} /></ToolCard>
      <ToolCard title="Gerar QR Code" description="Transforme links, textos ou WhatsApp em QR Codes." icon={<QrCode className="h-6 w-6" />}><input value={qrText} onChange={(event) => setQrText(event.target.value)} placeholder="Cole aqui o link ou texto" className="mt-5 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500" /><button type="button" onClick={async () => qrText.trim() && setQrImage(await QRCode.toDataURL(qrText, { width: 800, margin: 2 }))} className="mt-3 min-h-11 rounded-xl bg-brand-navy px-5 text-xs font-black text-white hover:bg-blue-800">Gerar QR Code</button>{qrImage && <div className="mt-4 flex items-center gap-4"><img src={qrImage} alt="QR Code gerado" className="h-28 w-28 rounded-xl border bg-white p-1" /><a href={qrImage} download="qrcode-educalizando.png" className="inline-flex items-center gap-1 text-xs font-black text-blue-700"><Download className="h-4 w-4" />Baixar QR Code</a></div>}</ToolCard>
    </section>
    <section className="space-y-4 pt-3"><div><h2 className="text-xl font-black text-slate-900">Crie e prepare seus materiais</h2><p className="mt-1 text-sm text-slate-500">Mais ferramentas rápidas para publicar, imprimir e compartilhar.</p></div><div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ToolCard title="Converter imagens para PDF" description="Transforme fotos, páginas escaneadas e atividades em um PDF na ordem selecionada." icon={<FileOutput className="h-6 w-6" />}><UploadButton label="Selecionar imagens para o PDF" accept="image/*,.heic" multiple onChange={convertImagesToPdf} /><HowTo steps={['Selecione todas as imagens do material.', 'A ordem escolhida será a ordem das páginas.', 'Clique em baixar quando o PDF for criado.']} note="Use imagens nítidas para manter textos e atividades legíveis na impressão." /></ToolCard>
      <ToolCard title="Redimensionar e converter imagem" description="Ajuste a medida e transforme suas artes para JPG, PNG ou WebP sem deformar." icon={<Maximize2 className="h-6 w-6" />}><div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Largura máxima<input type="number" min="200" max="4000" value={resizeWidth} onChange={(event) => setResizeWidth(Math.max(200, Number(event.target.value) || 1080))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><label className="text-xs font-bold text-slate-600">Formato<select value={resizeFormat} onChange={(event) => setResizeFormat(event.target.value as typeof resizeFormat)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label></div><UploadButton label="Selecionar imagens" accept="image/*,.heic" multiple onChange={resizeAndConvert} /><HowTo steps={['Defina a largura desejada; a altura é mantida proporcionalmente.', 'Escolha WebP para site, JPG para fotos ou PNG para artes.', 'Selecione uma ou mais imagens para baixar as versões prontas.']} /></ToolCard>
      <ToolCard title="Cortar imagem quadrada" description="Crie um corte 1:1 centralizado para fotos de perfil, miniaturas e capas." icon={<Scissors className="h-6 w-6" />}><UploadButton label="Escolher imagem para cortar" accept="image/*,.heic" onChange={cropImage} /><HowTo steps={['Escolha a imagem original.', 'O sistema centraliza automaticamente o corte quadrado.', 'Baixe a versão pronta para usar como miniatura ou capa.']} note="Para ter controle manual de zoom e posição, use o editor ao cadastrar a foto de capa do produto." /></ToolCard>
      <ToolCard title="Criar painel em folhas A4" description="Divida uma arte em várias folhas A4 para imprimir, recortar e montar na parede." icon={<Grid2X2 className="h-6 w-6" />}><div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Folhas na largura<input type="number" min="1" max="6" value={panelColumns} onChange={(event) => setPanelColumns(Math.min(6, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><label className="text-xs font-bold text-slate-600">Folhas na altura<input type="number" min="1" max="8" value={panelRows} onChange={(event) => setPanelRows(Math.min(8, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label></div><UploadButton label="Escolher imagem do painel" accept="image/*,.heic" onChange={createPanel} /><HowTo steps={['Defina quantas folhas deseja na largura e na altura.', 'Selecione a arte que será ampliada.', 'Imprima o PDF, recorte as bordas e monte o painel.']} /></ToolCard>
    </div></section>
    <section className="rounded-3xl border border-teal-100 bg-teal-50 p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" /><div><h2 className="font-black text-slate-900">Seus arquivos continuam privados</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">As ferramentas trabalham diretamente no navegador. Seus PDFs, imagens e arquivos ZIP não são enviados para os servidores da EducaliZando.</p></div></div><div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><p><strong className="block text-slate-900">Para web</strong>Prefira WebP e imagens até 1080 px.</p><p><strong className="block text-slate-900">Para impressão</strong>Use JPG ou PDF com imagens nítidas.</p><p><strong className="block text-slate-900">Antes de publicar</strong>Confira o arquivo baixado antes de substituir o original.</p></div></section>
  </div>;
}
