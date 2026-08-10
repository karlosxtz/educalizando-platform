'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, RefreshCw, X, Image as ImageIcon, Sparkles, VideoOff, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  label: string;
  helperText?: string;
  recommendationText?: string;
  bucket: 'product-covers' | 'product-files' | 'store-assets';
  accept: string;
  maxSizeMB?: number;
  value?: string | null;
  onChange: (url: string | null) => void;
  isImage?: boolean;
  aspectRatio?: '1:1' | '3:1' | '3:4';
}

const ABSOLUTE_MAX_SIZE_MB = 15; // Regra inegociável Educalizando: Máximo 15 MB por arquivo

// Extensões e tipos de vídeo proibidos para upload direto
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'mpeg', 'm4v', '3gp', 'wmv'];

function isVideoFile(file: File): boolean {
  if (file.type && file.type.toLowerCase().startsWith('video/')) {
    return true;
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

export default function FileUpload({
  label,
  helperText,
  recommendationText,
  bucket,
  accept,
  maxSizeMB = 15,
  value,
  onChange,
  isImage = false,
  aspectRatio = '1:1'
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limite efetivo: nunca pode ultrapassar 15 MB
  const effectiveMaxSizeMB = Math.min(maxSizeMB, ABSOLUTE_MAX_SIZE_MB);

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const processFileUpload = async (file: File) => {
    setError(null);

    // 1. Validação OBRIGATÓRIA: Bloqueio estrito de upload de vídeos
    if (isVideoFile(file)) {
      setError({
        title: 'Vídeos não podem ser enviados para a plataforma',
        message: 'A Educalizando não realiza hospedagem de vídeos. Para disponibilizar videoaulas ou treinamentos, utilize a opção "Link Externo" (YouTube, Vimeo, Google Drive, etc.).'
      });
      return;
    }

    // 2. Validação OBRIGATÓRIA: Limite Máximo de 15 MB por Arquivo
    const maxSizeBytes = effectiveMaxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError({
        title: 'Arquivo muito grande',
        message: `Cada arquivo enviado deve ter no máximo ${effectiveMaxSizeMB} MB.`
      });
      return;
    }

    setUploading(true);
    setProgress(15);

    try {
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Simulação de progresso fluído
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? prev : prev + 15));
      }, 150);

      if (isRealSupabase) {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        clearInterval(interval);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        const finalUrl = publicUrlData.publicUrl;
        setProgress(100);
        setTimeout(() => {
          setUploading(false);
          onChange(finalUrl);
        }, 300);
      } else {
        // Fallback local dev
        clearInterval(interval);
        const localUrl = URL.createObjectURL(file);
        setProgress(100);
        setTimeout(() => {
          setUploading(false);
          onChange(localUrl);
        }, 300);
      }
    } catch (err: any) {
      setUploading(false);
      setError({
        title: 'Erro no Upload',
        message: err.message || 'Erro ao realizar o upload do arquivo. Tente novamente.'
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          {label}
        </label>
        <span className="text-[11px] font-extrabold text-brand-navy bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          Máx. {effectiveMaxSizeMB} MB
        </span>
      </div>

      {/* Regra Visual Obrigatória Educalizando */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 font-medium flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Info className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
          <span>Envie um arquivo de até <strong>{effectiveMaxSizeMB} MB</strong>.</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
          <VideoOff className="w-3 h-3 text-rose-500 flex-shrink-0" />
          <span>Sem upload de vídeo</span>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 font-medium leading-tight">
          {helperText}
        </p>
      )}

      {recommendationText && (
        <div className="bg-blue-50/70 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span>{recommendationText}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Estado A: Arquivo Selecionado */}
      {value && !uploading && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {isImage ? (
              <div className={`overflow-hidden border-2 border-white shadow-md bg-slate-200 flex-shrink-0 ${
                aspectRatio === '1:1' ? 'w-16 h-16 rounded-full' :
                aspectRatio === '3:1' ? 'w-36 h-12 rounded-xl' :
                'w-14 h-18 rounded-xl'
              }`}>
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5" />
              </div>
            )}
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {isImage ? 'Imagem Carregada com Sucesso' : 'Arquivo Digital Validade'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Arquivo pronto no Supabase (≤ {effectiveMaxSizeMB}MB)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Remover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Estado B: Barra de Progresso de Upload */}
      {uploading && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600 animate-bounce" />
              Verificando e enviando arquivo (máx {effectiveMaxSizeMB}MB)...
            </span>
            <span className="text-blue-600 font-extrabold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Estado C: Área de Drag & Drop */}
      {!value && !uploading && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-2">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
            </div>
            <p className="text-xs font-bold text-slate-800">
              Arraste seu arquivo de até {effectiveMaxSizeMB}MB aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Vídeos não podem ser enviados para a plataforma.
            </p>
          </div>

          {error && (
            <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs space-y-1 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error.title}</span>
              </div>
              <p className="text-[11px] text-rose-700 pl-5 leading-relaxed">
                {error.message}
              </p>
              <div className="pt-2 pl-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-rose-800 underline font-bold text-[11px] flex items-center gap-1 hover:text-rose-950"
                >
                  <RefreshCw className="w-3 h-3" /> Selecionar outro arquivo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
