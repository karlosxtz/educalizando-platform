'use client';

import { AlertCircle, CheckCircle2, File, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { uploadToObjectStorage, UploadBucket } from '@/lib/object-storage-client';
import { ProductDeliveryFile } from '@/lib/types';

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function readableSize(bytes?: number | null) {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function DeliveryFilesUpload({ bucket, value, onChange, accept }: {
  bucket: Extract<UploadBucket, 'product-files' | 'plr-files'>;
  value: ProductDeliveryFile[];
  onChange: (files: ProductDeliveryFile[]) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const uploadFiles = async (selected: File[]) => {
    if (!selected.length) return;
    const invalid = selected.find((file) => file.size > MAX_FILE_BYTES || file.type.startsWith('video/'));
    if (invalid) {
      toast.error(invalid.size > MAX_FILE_BYTES
        ? `${invalid.name} ultrapassa 15 MB.`
        : `${invalid.name} é um vídeo. Envie documentos, imagens ou arquivos compactados.`);
      return;
    }
    setUploading(true);
    setProgress({ current: 0, total: selected.length });
    const uploaded: ProductDeliveryFile[] = [];
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        setProgress({ current: index + 1, total: selected.length });
        const url = await uploadToObjectStorage(bucket, file);
        uploaded.push({ url, name: file.name, size: file.size, mimeType: file.type || 'application/octet-stream' });
      }
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} arquivo(s) enviado(s) com sucesso.`);
    } catch (error) {
      if (uploaded.length) onChange([...value, ...uploaded]);
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar os arquivos.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return <div className="space-y-3 rounded-2xl border border-blue-200 bg-white p-4">
    <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(event) => uploadFiles(Array.from(event.target.files || []))} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-black text-slate-900">Arquivos para entrega</p>
        <p className="mt-1 text-xs font-medium text-slate-500">Sem limite de quantidade · máximo de 15 MB por arquivo.</p>
      </div>
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-60">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : value.length ? <Plus className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
        {uploading ? `Enviando ${progress.current} de ${progress.total}` : value.length ? 'Adicionar mais arquivos' : 'Selecionar arquivos'}
      </button>
    </div>
    {value.length > 0 && <div className="space-y-2">
      {value.map((file, index) => <div key={`${file.url}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700"><File className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-900">{file.name || `Arquivo ${index + 1}`}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Pronto para entrega {readableSize(file.size) && `· ${readableSize(file.size)}`}</p></div>
        <button type="button" aria-label={`Remover ${file.name}`} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
      </div>)}
    </div>}
    {!value.length && <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs font-medium text-blue-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />Você pode selecionar vários arquivos de uma vez e adicionar outros depois.</div>}
  </div>;
}
