"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  getRarityChipClass,
  getRarityLabel,
  getRarityRingClass,
  type RarityTier,
} from "@/lib/badges";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tab = "all" | "earned" | "locked";

type BadgeRow = {
  _id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  rarity: RarityTier;
  criteriaText: string;
};

type EarnedRow = {
  badgeId: string;
  earnedAt: number;
};

export default function StudentBadgesPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const allBadges = useQuery(api.badges.list);
  const earned = useQuery(
    api.badges.listEarnedByStudent,
    profile?._id ? { studentId: profile._id } : "skip",
  );

  const [tab, setTab] = useState<Tab>("all");
  const [detailBadge, setDetailBadge] = useState<{
    badge: BadgeRow;
    earnedAt: number | null;
  } | null>(null);

  const earnedBadgeIds = useMemo(
    () => new Set((earned ?? []).map((e: EarnedRow) => e.badgeId)),
    [earned],
  );

  const earnedAtById = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of earned ?? []) map.set(e.badgeId, e.earnedAt);
    return map;
  }, [earned]);

  if (
    allBadges === undefined ||
    profile === undefined ||
    earned === undefined
  ) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Chargement du coffre...</span>
      </div>
    );
  }

  const badges = (allBadges as BadgeRow[]) ?? [];
  const earnedCount = earnedBadgeIds.size;
  const totalCount = badges.length;
  const lockedCount = totalCount - earnedCount;

  const visibleBadges = badges.filter((b) => {
    const isEarned = earnedBadgeIds.has(b._id);
    if (tab === "earned") return isEarned;
    if (tab === "locked") return !isEarned;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-gray-900">
          Mon coffre
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {earnedCount}/{totalCount} badge{totalCount > 1 ? "s" : ""}
          {earnedCount > 0 ? " obtenu" + (earnedCount > 1 ? "s" : "") : ""}
        </p>
      </div>

      {/* D10 — Tabs : Tous / Obtenus / Verrouillés */}
      <div className="mb-6 flex gap-2" role="tablist" aria-label="Filtre des badges">
        <TabPill
          isActive={tab === "all"}
          onClick={() => setTab("all")}
          label="Tous"
          count={totalCount}
        />
        <TabPill
          isActive={tab === "earned"}
          onClick={() => setTab("earned")}
          label="Obtenus"
          count={earnedCount}
        />
        <TabPill
          isActive={tab === "locked"}
          onClick={() => setTab("locked")}
          label="Verrouillés"
          count={lockedCount}
        />
      </div>

      {visibleBadges.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">
            {tab === "earned"
              ? "Aucun badge obtenu pour l'instant. Continue tes exercices !"
              : tab === "locked"
                ? "Tu as déballé tous les badges, bravo !"
                : "Aucun badge disponible pour le moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge._id);
            const ringClass = isEarned ? getRarityRingClass(badge.rarity) : "";
            return (
              <motion.button
                type="button"
                key={badge._id}
                onClick={() =>
                  setDetailBadge({
                    badge,
                    earnedAt: earnedAtById.get(badge._id) ?? null,
                  })
                }
                whileHover={{ scale: 1.04, y: -3 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className={`relative flex min-h-44 flex-col items-center rounded-2xl border-2 p-5 text-center shadow-sm transition-colors ${
                  isEarned
                    ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                } ${ringClass}`}
                aria-label={
                  isEarned
                    ? `${badge.name} — obtenu`
                    : `${badge.name} — verrouillé`
                }
              >
                {/* D10 — rarity chip on earned, top-right */}
                {isEarned && badge.rarity !== "common" && (
                  <span
                    className={`absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getRarityChipClass(
                      badge.rarity,
                    )}`}
                  >
                    {badge.rarity === "legendary" && (
                      <Sparkles className="h-2.5 w-2.5" aria-hidden />
                    )}
                    {getRarityLabel(badge.rarity)}
                  </span>
                )}

                {/* Icon */}
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                    isEarned ? "bg-yellow-100" : "bg-gray-200"
                  }`}
                >
                  {isEarned ? (
                    <span aria-hidden>{badge.icon}</span>
                  ) : (
                    /* D10b — silhouette + lock instead of "???" */
                    <div className="relative flex items-center justify-center">
                      <span
                        className="opacity-25 grayscale"
                        aria-hidden
                      >
                        {badge.icon}
                      </span>
                      <Lock
                        className="absolute h-5 w-5 text-gray-400"
                        aria-hidden
                      />
                    </div>
                  )}
                </div>

                {/* Name */}
                <p
                  className={`mt-3 text-sm font-semibold ${
                    isEarned ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {badge.name}
                </p>

                {/* D10b — readable criteria (locked) OR description (earned) */}
                <p
                  className={`mt-1 text-xs ${
                    isEarned ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {isEarned ? badge.description : badge.criteriaText}
                </p>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog
        open={detailBadge !== null}
        onOpenChange={(open) => {
          if (!open) setDetailBadge(null);
        }}
      >
        <DialogContent>
          {detailBadge && (
            <>
              <DialogHeader>
                <div
                  className={`mb-2 flex h-20 w-20 items-center justify-center rounded-3xl text-5xl ${
                    earnedBadgeIds.has(detailBadge.badge._id)
                      ? "bg-yellow-100"
                      : "bg-gray-200"
                  } ${
                    earnedBadgeIds.has(detailBadge.badge._id)
                      ? getRarityRingClass(detailBadge.badge.rarity)
                      : ""
                  }`}
                >
                  {earnedBadgeIds.has(detailBadge.badge._id) ? (
                    <span aria-hidden>{detailBadge.badge.icon}</span>
                  ) : (
                    <Lock className="h-8 w-8 text-gray-400" aria-hidden />
                  )}
                </div>
                <DialogTitle>{detailBadge.badge.name}</DialogTitle>
                {detailBadge.badge.rarity !== "common" && (
                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getRarityChipClass(
                      detailBadge.badge.rarity,
                    )}`}
                  >
                    {detailBadge.badge.rarity === "legendary" && (
                      <Sparkles className="h-3 w-3" aria-hidden />
                    )}
                    {getRarityLabel(detailBadge.badge.rarity)}
                  </span>
                )}
                <DialogDescription>
                  {earnedBadgeIds.has(detailBadge.badge._id)
                    ? detailBadge.badge.description
                    : detailBadge.badge.criteriaText}
                </DialogDescription>
              </DialogHeader>
              {detailBadge.earnedAt !== null && (
                <p className="text-center text-xs font-semibold text-yellow-700">
                  Obtenu le{" "}
                  {new Date(detailBadge.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabPill({
  isActive,
  onClick,
  label,
  count,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        isActive
          ? "bg-orange-500 text-white shadow-md shadow-orange-200"
          : "bg-white text-gray-600 hover:bg-amber-50"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
          isActive ? "bg-white/20" : "bg-gray-100"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
