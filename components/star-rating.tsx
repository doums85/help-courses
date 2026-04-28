"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Affichage étoiles 0-3 pour un score interne 0-10 (Decision 81).
 *
 * Mapping (cf. convex/paliers/scoring.ts scoreToStarsSingle):
 *   - score >= 9 → 3⭐
 *   - score >= 6 → 2⭐
 *   - score >= 3 → 1⭐
 *   - else        → 0⭐
 *
 * IMPORTANT (Decision 99 — Arbiter caveat) : on n'expose JAMAIS le score 0-10 brut côté kid.
 */
export function StarRating({
  stars,
  total = 3,
  size = 20,
  animated = true,
  className = "",
}: {
  stars: number;
  total?: number;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`${stars} étoiles sur ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < stars;
        const Wrapper = animated ? motion.div : "div";
        const wrapperProps = animated
          ? {
              initial: { scale: 0, rotate: -45 },
              animate: { scale: 1, rotate: 0 },
              transition: { delay: i * 0.08, type: "spring" as const, stiffness: 240 },
            }
          : {};
        return (
          <Wrapper key={i} {...(wrapperProps as object)}>
            <Star
              size={size}
              className={
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300"
              }
              strokeWidth={2}
            />
          </Wrapper>
        );
      })}
    </div>
  );
}

/**
 * Barre de progression palier en étoiles.
 * Affiche "X⭐ sur 30" + barre visuelle.
 * Seuil de validation = 21⭐ (équivalent du 7/10 backend).
 */
export function PalierStarsBar({
  starsTotal,
  threshold = 21,
  max = 30,
  className = "",
}: {
  starsTotal: number;
  threshold?: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min(100, (starsTotal / max) * 100);
  const thresholdPct = (threshold / max) * 100;
  const validated = starsTotal >= threshold;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span
          className={validated ? "text-green-600" : "text-gray-700"}
        >
          {starsTotal}⭐ sur {max}
        </span>
        <span className="text-xs text-gray-500">Validation: {threshold}⭐</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            validated
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
              : "bg-gradient-to-r from-orange-400 to-pink-500"
          }`}
        />
        {/* Marqueur seuil */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-700"
          style={{ left: `${thresholdPct}%` }}
          aria-label="Seuil de validation"
        />
      </div>
    </div>
  );
}
