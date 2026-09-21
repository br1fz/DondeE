import React, { useState } from "react";
import type { Venue, ClientProfile, Review } from "../types";

interface Props {
  venue: Venue;
  activeClient: ClientProfile;
  isOpen: boolean;
  onClose: () => void;
  onAddReview: (review: Review) => void;
}

export default function AddReviewModal({
  venue,
  activeClient,
  isOpen,
  onClose,
  onAddReview,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newReview: Review = {
      id: "r-" + Date.now(),
      userName: activeClient.name,
      userEmail: activeClient.email,
      rating,
      comment: comment.trim(),
      timeAgo: "recién",
      date: "Ahora",
    };

    onAddReview(newReview);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment("");
      setRating(5);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-[380px] rounded-3xl p-6 border border-purple-500/30 overflow-hidden relative"
        style={{
          background: "linear-gradient(150deg, #130c2e 0%, #090616 100%)",
          boxShadow: "0 0 50px rgba(168, 85, 247, 0.3)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-sm w-7 h-7 rounded-full bg-white/5 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="mb-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400">
            {venue.city} · {venue.sector}
          </span>
          <h3 className="font-display font-extrabold text-white text-lg leading-tight mt-0.5">
            Calificar {venue.name}
          </h3>
          <p className="font-mono text-xs text-white/50 mt-1">
            Opinando como: <span className="text-purple-300 font-semibold">{activeClient.name}</span>
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center mx-auto mb-3 text-xl">
              ✓
            </div>
            <h4 className="font-display font-bold text-white text-base">¡Reseña Publicada!</h4>
            <p className="font-mono text-xs text-white/50 mt-1">
              Insertada exitosamente en la experiencia social nocturna.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Stars */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                Calificación Social:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-2xl transition-transform hover:scale-125"
                    style={{
                      color: star <= rating ? "#fbbf24" : "rgba(255,255,255,0.15)",
                      textShadow: star <= rating ? "0 0 12px rgba(251,191,36,0.6)" : "none",
                    }}
                  >
                    ★
                  </button>
                ))}
                <span className="font-mono text-xs text-yellow-400 font-bold self-center ml-2">
                  {rating}.0
                </span>
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                Tu comentario del ambiente nocturno:
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Ej: Excelente música y ambiente, terraza con vista increíble..."
                required
                className="w-full rounded-2xl p-3 bg-white/5 border border-white/10 text-white placeholder-white/25 text-xs font-sans focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl font-display font-bold text-sm text-white transition-all shadow-lg"
              style={{
                background: "linear-gradient(135deg, #9333ea, #db2777)",
                boxShadow: "0 0 20px rgba(168,85,247,0.4)",
              }}
            >
              Publicar Reseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
