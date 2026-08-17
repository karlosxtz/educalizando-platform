'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, X, Image as ImageIcon, Sparkles, VideoOff, Info, MoveLeft, MoveRight } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

interface FileUploadMultipleProps {
  label: string;
  helperText?: string;
  recommendationText?: string;
  bucket: 'product-covers' | 'product-files' | 'store-assets' | 'student-avatars';
  accept: string;
  maxSizeMB?: number;
  value?: string[];
  onChange: (urls: string[]) => void;
  maxItems?: number;
}

const ABSOLUTE_MAX_SIZE_MB = 15;
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'mpeg', 'm4v', '3gp', 'wmv'];

function isVideoFile(file: File): boolean {
  if (file.type && file.type.toLowerCase().startsWith('video/')) return true;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

export default function FileUploadMultiple({
  label,
  helperText,
  recommendationText,
  bucket,
  accept,
  maxSizeMB = 15,
  value = [],
  onChange,
  maxItems = 10
}: FileUploadMultipleProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveMaxSizeMB = Math.min(maxSizeMB, ABSOLUTE_MAX_SIZE_MB);

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const processFileUpload = async (files: FileList | File[]) => {
    setError(null);
    const filesArray = Array.from(files);

    if (value.length + filesArray.length > maxItems) {
      setError({
        title: `Limite atingido`,
        message: `Você só pode adicionar até ${maxItems} imagens no total.`
      });
      return;
    }

    setUploading(true);
    setProgress(5);
    
    const newUrls: string[] = [];
    const maxSizeBytes = effectiveMaxSizeMB * 1024 * 1024;

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];

        if (isVideoFile(file)) {
          throw new Error('Vídeos não podem ser enviados. Apenas imagens.');
        }
        if (file.size > maxSizeBytes) {
          throw new Error(`Arquivo muito grande. Máximo de ${effectiveMaxSizeMB} MB.`);
        }

        let finalFile = file;

        // 3. Compactação Inteligente de Imagens (Se for imagem, compacta no navegador antes do upload)
        if (file.type.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: 'image/webp'
            };
            const compressedBlob = await imageCompression(file, options);
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            finalFile = new window.File([compressedBlob], newFileName, { type: 'image/webp' });
          } catch (error) {
            console.warn('Erro ao compactar a imagem (FileUploadMultiple):', error);
          }
        }

        const fileExt = finalFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        if (isRealSupabase) {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, finalFile, { cacheControl: '3600', upsert: true });

          if (uploadError) throw new Error(uploadError.message);

          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

          newUrls.push(publicUrlData.publicUrl);
        } else {
          // Fallback local dev
          newUrls.push(URL.createObjectURL(finalFile));
        }
        setProgress(Math.round(((i + 1) / filesArray.length) * 100));
      }

      setUploading(false);
      onChange([...value, ...newUrls]);
    } catch (err: any) {
      setUploading(false);
      setError({
        title: 'Erro no Upload',
        message: err.message || 'Erro ao realizar o upload do arquivo.'
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileUpload(e.target.files);
    }
    // Reset input value to allow re-upload of the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    const newValues = value.filter((_, i) => i !== indexToRemove);
    onChange(newValues);
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newValues = [...value];
    const temp = newValues[index - 1];
    newValues[index - 1] = newValues[index];
    newValues[index] = temp;
    onChange(newValues);
  };

  const moveRight = (index: number) => {
    if (index === value.length - 1) return;
    const newValues = [...value];
    const temp = newValues[index + 1];
    newValues[index + 1] = newValues[index];
    newValues[index] = temp;
    onChange(newValues);
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          {label} ({value.length}/{maxItems})
        </label>
        <span className="text-[11px] font-extrabold text-brand-navy bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          Máx. {effectiveMaxSizeMB} MB / arquivo
        </span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 font-medium flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Info className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
          <span>A primeira imagem da lista será a sua <strong>Capa Principal</strong>.</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
          <ImageIcon className="w-3 h-3 text-emerald-500 flex-shrink-0" />
          <span>Até {maxItems} imagens</span>
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
        multiple
      />

      {/* Grid de miniaturas */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div key={url + index} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-[3/4] w-full relative bg-slate-100">
                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                    Capa
                  </div>
                )}
                {/* Ações Hover */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => moveLeft(index)} disabled={index === 0} className={`p-1.5 rounded-full ${index === 0 ? 'bg-white/20 text-white/50' : 'bg-white text-slate-700 hover:text-blue-600'} transition-colors`}>
                    <MoveLeft className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => removeFile(index)} className="p-1.5 rounded-full bg-white text-rose-600 hover:bg-rose-50 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveRight(index)} disabled={index === value.length - 1} className={`p-1.5 rounded-full ${index === value.length - 1 ? 'bg-white/20 text-white/50' : 'bg-white text-slate-700 hover:text-blue-600'} transition-colors`}>
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Box */}
      {value.length < maxItems && !uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-2xl transition-all duration-200 outline-none focus:ring-4 focus:ring-blue-500/20 ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : error 
                ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/50' 
                : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
            dragOver ? 'bg-blue-100 text-blue-600' : error ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h4 className={`text-sm font-bold ${error ? 'text-rose-600' : 'text-slate-900'}`}>
              Adicionar mais imagens
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Arraste as fotos para cá ou clique para procurar no dispositivo.
            </p>
          </div>
        </button>
      )}

      {/* Progress */}
      {uploading && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600 animate-bounce" />
              Verificando e enviando arquivos...
            </span>
            <span className="text-blue-600 font-extrabold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !uploading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold">{error.title}</h5>
            <p className="text-[11px] font-medium text-rose-700/80 leading-relaxed">
              {error.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
