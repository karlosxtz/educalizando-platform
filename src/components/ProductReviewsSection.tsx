'use client';

import { useState } from 'react';
import { Star, MessageSquare, ShieldCheck, ThumbsUp, UserCheck } from 'lucide-react';
import { Review, ReviewStats } from '@/lib/types';
import { calculateReviewStats } from '@/lib/review-service';

interface ProductReviewsSectionProps {
  reviews: Review[];
  primaryColor?: string;
}

export default function ProductReviewsSection({
  reviews,
  primaryColor = '#093b6c'
}: ProductReviewsSectionProps) {
  const stats: ReviewStats = calculateReviewStats(reviews);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'all') return true;
    return Math.round(r.nota) === filterRating;
  });

  const renderStars = (rating: number, sizeClass = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 fill-slate-100'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-8 font-sans">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal block">
            DEPOIMENTOS & AVALIAÇÕES
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <MessageSquare className="w-6 h-6 text-brand-navy" />
            O que os alunos estão dizendo
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Avaliações de Alunos Verificados</span>
          </span>
        </div>
      </div>

      {/* Ratings Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80 items-center">
        
        {/* Left Rating Average Box */}
        <div className="lg:col-span-4 text-center lg:border-r border-slate-200 lg:pr-6 space-y-2">
          <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight block">
            {stats.averageRating.toFixed(1)}
          </span>
          
          <div className="flex justify-center">
            {renderStars(stats.averageRating, 'w-5 h-5')}
          </div>

          <p className="text-xs text-slate-500 font-semibold">
            Média baseada em <strong>{stats.totalReviews}</strong> {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'} de alunos
          </p>
        </div>

        {/* Right Star Rating Breakdown Progress Bars */}
        <div className="lg:col-span-8 space-y-2 max-w-md mx-auto w-full">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.ratingCounts[stars] || 0;
            const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;

            return (
              <button
                key={stars}
                onClick={() => setFilterRating(filterRating === stars ? 'all' : stars)}
                className={`w-full flex items-center gap-3 text-xs font-bold transition-all p-1 rounded-lg ${
                  filterRating === stars ? 'bg-slate-200/70' : 'hover:bg-slate-100'
                }`}
              >
                <span className="w-12 text-slate-600 text-right flex items-center justify-end gap-1">
                  {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>

                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-slate-400 text-left font-mono text-[11px]">
                  {percentage}%
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Filter Tabs */}
      {stats.totalReviews > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrar:</span>
          <button
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterRating === 'all'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({stats.totalReviews})
          </button>
          {[5, 4, 3].map((star) => (
            <button
              key={star}
              onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                filterRating === star
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{star} Estrelas</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      )}

      {/* Student Review Cards List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
          Nenhuma avaliação encontrada com esta classificação de estrelas.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const initial = review.student_name ? review.student_name.charAt(0).toUpperCase() : 'A';
            const formattedDate = review.created_at
              ? new Date(review.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Recentemente';

            return (
              <div
                key={review.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-navy text-white font-black text-base flex items-center justify-center shadow-xs">
                      {initial}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{review.student_name}</h4>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Compra Verificada
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{formattedDate}</span>
                    </div>
                  </div>

                  <div>
                    {renderStars(review.nota, 'w-3.5 h-3.5')}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pl-1">
                  "{review.comentario}"
                </p>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}
