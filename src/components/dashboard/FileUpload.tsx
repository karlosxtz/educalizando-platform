'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  label: string;
  helperText?: string;
  bucket: 'product-covers' | 'product-files' | 'store-assets';
  accept: string;
  maxSizeMB: number;
  value?: string | null;
  onChange: (url: string | null) => void;
  isImage?: boolean;
}

export default function FileUpload({
  label,
  helperText,
  bucket,
  accept,
  maxSizeMB,
  value,
  onChange,
  isImage = false
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const processFileUpload = async (file: File) => {
    setError(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo excede o tamanho máximo permitido de ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setProgress(15);

    try {
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Progress Simulation Timer
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
        // Dev Fallback Mode: Create Object URL
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
      setError(err.message || 'Erro ao realizar o upload do arquivo. Tente novamente.');
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          {label}
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          Máx. {maxSizeMB}MB
        </span>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 font-medium leading-tight">
          {helperText}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* State A: File Selected & Verified */}
      {value && !uploading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {isImage ? (
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5" />
              </div>
            )}
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {isImage ? 'Imagem de Capa Carregada' : 'Arquivo Didático Carregado'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Upload concluído com sucesso
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

      {/* State B: Uploading Progress Bar */}
      {uploading && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600 animate-bounce" />
              Enviando arquivo para o Supabase Storage...
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

      {/* State C: Drag and Drop Upload Area */}
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
              Arraste seu arquivo aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Formatos aceitos: {accept}
            </p>
          </div>

          {error && (
            <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 font-medium">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-rose-700 underline font-bold text-[11px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Tentar novamente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
