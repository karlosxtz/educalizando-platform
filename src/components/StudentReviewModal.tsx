'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { submitProductReview } from '@/app/actions/review-actions';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  storeId: string;
  studentId: string;
  initialRating?: number;
  initialComment?: string;
  onSuccess?: (newRating: number, newComment: string) => void;
}

export default function StudentReviewModal({
  isOpen,
  onClose,
  productId,
  storeId,
  studentId,
  initialRating = 0,
  initialComment = '',
  onSuccess
}: StudentReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [isOpen, initialRating, initialComment]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    
    const result = await submitProductReview({
      productId,
      storeId,
      studentId,
      nota: rating,
      comentario: comment.trim()
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Avaliação salva com sucesso! Obrigado pelo feedback.');
      if (onSuccess) onSuccess(rating, comment.trim());
      onClose();
    } else {
      toast.error(result.error || 'Erro ao salvar avaliação. Tente novamente.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Avaliar Material</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sua opinião ajuda outros alunos. Conte-nos o que achou!
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-6">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-all focus:outline-none"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating) 
                          ? 'fill-amber-400 text-amber-400 scale-110' 
                          : 'text-slate-200 fill-slate-100'
                      } transition-all duration-200`}
                    />
                  </button>
                ))}
              </div>

              <div className="w-full space-y-2">
                <label className="text-sm font-bold text-slate-700">Comentário (Opcional)</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="O que você mais gostou neste material?"
                  className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm resize-none"
                  maxLength={500}
                />
                <div className="text-right text-[10px] text-slate-400 font-medium">
                  {comment.length}/500
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : (
                  'Enviar Avaliação'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
