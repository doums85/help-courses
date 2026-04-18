"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Apple, CheckCircle2, GripVertical } from "lucide-react";

import { Section } from "./section";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

type ExerciseCard = {
  label: string;
  title: string;
  description: string;
  tint: string;
  accent: string;
  preview: (hovered: boolean) => React.ReactNode;
};

function QcmPreview({ hovered }: { hovered: boolean }) {
  const options = [
    { v: "12", ok: true },
    { v: "8", ok: false },
    { v: "15", ok: false },
    { v: "6", ok: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o, i) => (
        <motion.div
          key={o.v}
          animate={
            o.ok
              ? hovered
                ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(16,185,129,0)",
                      "0 0 0 6px rgba(16,185,129,0.18)",
                      "0 0 0 0 rgba(16,185,129,0)",
                    ],
                    transition: {
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    },
                  }
                : { scale: 1, boxShadow: "0 0 0 0 rgba(16,185,129,0)" }
              : hovered
                ? {
                    opacity: 0.45,
                    transition: { duration: 0.3, delay: 0.1 + i * 0.05 },
                  }
                : { opacity: 1 }
          }
          className={
            o.ok
              ? "flex items-center justify-between rounded-xl border-2 border-emerald-400 bg-white px-3 py-2 text-sm font-bold text-emerald-700"
              : "flex items-center justify-between rounded-xl border-2 border-gray-100 bg-white/80 px-3 py-2 text-sm font-semibold text-gray-500"
          }
        >
          <span>{o.v}</span>
          {o.ok && (
            <motion.span
              animate={hovered ? { rotate: [0, 15, -10, 0] } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function DragDropPreview({ hovered }: { hovered: boolean }) {
  return (
    <div className="space-y-2.5">
      <motion.div
        animate={
          hovered
            ? {
                borderColor: "rgb(34,197,94)",
                backgroundColor: "rgba(220,252,231,0.9)",
              }
            : {
                borderColor: "rgb(253,186,116)",
                backgroundColor: "rgba(255,255,255,0.7)",
              }
        }
        transition={{ duration: 0.3, delay: hovered ? 0.45 : 0 }}
        className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-xs font-bold"
      >
        <span className="flex items-center gap-2 text-orange-700">
          <Apple className="size-4" aria-hidden />
          Déposer ici : Fruits
        </span>
        <motion.span
          initial={false}
          animate={hovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.3, delay: hovered ? 0.55 : 0 }}
        >
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
        </motion.span>
      </motion.div>
      <div className="flex gap-2">
        <motion.span
          animate={
            hovered
              ? { y: -40, x: 14, opacity: 0, scale: 0.85 }
              : { y: 0, x: 0, opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
        >
          <GripVertical className="size-3 text-gray-400" aria-hidden />
          pomme
        </motion.span>
        <motion.span
          animate={hovered ? { y: [0, -2, 0] } : { y: 0 }}
          transition={{
            duration: 1,
            repeat: hovered ? Number.POSITIVE_INFINITY : 0,
            ease: "easeInOut",
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
        >
          <GripVertical className="size-3 text-gray-400" aria-hidden />
          fraise
        </motion.span>
      </div>
    </div>
  );
}

function AssociationPreview({ hovered }: { hovered: boolean }) {
  const pairs = [
    { a: "chat", b: "miauler" },
    { a: "chien", b: "aboyer" },
  ];
  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div
          key={pair.a}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 text-xs font-bold"
        >
          <motion.span
            animate={
              hovered
                ? {
                    backgroundColor: "rgb(224,242,254)",
                    scale: [1, 1.04, 1],
                  }
                : { backgroundColor: "rgb(255,255,255)", scale: 1 }
            }
            transition={{ duration: 0.4, delay: i * 0.2 }}
            className="rounded-lg px-2.5 py-1.5 text-center text-gray-700 shadow-sm ring-1 ring-sky-200"
          >
            {pair.a}
          </motion.span>
          <motion.span
            animate={
              hovered
                ? { scale: [1, 1.4, 1], color: "#0284c7" }
                : { scale: 1, color: "#7dd3fc" }
            }
            transition={{
              duration: 0.6,
              delay: i * 0.2 + 0.1,
              repeat: hovered ? Number.POSITIVE_INFINITY : 0,
              repeatDelay: 0.8,
            }}
            aria-hidden
            className="font-black"
          >
            ←→
          </motion.span>
          <motion.span
            animate={
              hovered
                ? {
                    backgroundColor: "rgb(224,242,254)",
                    scale: [1, 1.04, 1],
                  }
                : { backgroundColor: "rgb(255,255,255)", scale: 1 }
            }
            transition={{ duration: 0.4, delay: i * 0.2 + 0.2 }}
            className="rounded-lg px-2.5 py-1.5 text-center text-gray-700 shadow-sm ring-1 ring-sky-200"
          >
            {pair.b}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

function OrderPreview({ hovered }: { hovered: boolean }) {
  const letters = ["L", "I", "V", "R", "E"];
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm font-extrabold">
      {letters.map((l, i) => (
        <motion.span
          key={l}
          animate={
            hovered
              ? { y: [0, -10, 0], rotate: [0, -6, 6, 0] }
              : { y: 0, rotate: 0 }
          }
          transition={{
            duration: 0.5,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
          className="relative flex size-9 items-center justify-center rounded-lg bg-white text-lime-800 shadow-sm ring-1 ring-lime-300"
        >
          <motion.span
            initial={false}
            animate={
              hovered
                ? { scale: [0.6, 1.3, 1], opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.35, delay: i * 0.08 + 0.05 }}
            className="absolute -top-1.5 -right-1 flex size-4 items-center justify-center rounded-full bg-lime-500 text-[9px] font-bold text-white"
          >
            {i + 1}
          </motion.span>
          {l}
        </motion.span>
      ))}
    </div>
  );
}

function FreeAnswerPreview({ hovered }: { hovered: boolean }) {
  return (
    <motion.div
      animate={
        hovered
          ? { borderColor: "rgb(34,197,94)" }
          : { borderColor: "rgb(250,204,21)" }
      }
      transition={{ duration: 0.3, delay: hovered ? 0.3 : 0 }}
      className="rounded-xl border-2 bg-white px-3 py-2.5 shadow-sm"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Ta réponse
      </p>
      <p className="mt-1 flex items-center text-base font-extrabold text-gray-900">
        <motion.span
          animate={hovered ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-block"
        >
          42
        </motion.span>
        <motion.span
          aria-hidden
          animate={hovered ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-amber-500 align-middle"
        />
      </p>
      <div className="mt-1 h-4 overflow-hidden">
        <motion.div
          initial={false}
          animate={
            hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
          }
          transition={{ duration: 0.3, delay: hovered ? 0.35 : 0 }}
          className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"
        >
          <CheckCircle2 className="size-3" aria-hidden />
          Validé !
        </motion.div>
      </div>
    </motion.div>
  );
}

const TYPES: ExerciseCard[] = [
  {
    label: "QCM",
    title: "Questions à choix multiples",
    description: "Quatre propositions, une bonne réponse. Simple et efficace.",
    tint: "from-amber-50 to-amber-100/60",
    accent: "text-amber-700",
    preview: (hovered) => <QcmPreview hovered={hovered} />,
  },
  {
    label: "Glisser-déposer",
    title: "Drag & drop",
    description: "Classer, trier, ranger — par le geste.",
    tint: "from-orange-50 to-orange-100/60",
    accent: "text-orange-700",
    preview: (hovered) => <DragDropPreview hovered={hovered} />,
  },
  {
    label: "Association",
    title: "Relier les paires",
    description: "Associer des mots, images ou concepts qui vont ensemble.",
    tint: "from-sky-50 to-sky-100/60",
    accent: "text-sky-700",
    preview: (hovered) => <AssociationPreview hovered={hovered} />,
  },
  {
    label: "Mise en ordre",
    title: "Remettre en ordre",
    description: "Chronologie, étapes, lettres d'un mot — dans le bon ordre.",
    tint: "from-lime-50 to-lime-100/60",
    accent: "text-lime-700",
    preview: (hovered) => <OrderPreview hovered={hovered} />,
  },
  {
    label: "Réponse libre",
    title: "Réponse courte",
    description: "Écrire la solution — l'orthographe compte.",
    tint: "from-yellow-50 to-yellow-100/60",
    accent: "text-yellow-700",
    preview: (hovered) => <FreeAnswerPreview hovered={hovered} />,
  },
];

function ExerciseCardView({ type }: { type: ExerciseCard }) {
  const [hovered, setHovered] = useState(false);
  return (
    <StaggerItem
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTap={() => setHovered((current) => !current)}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        <span className={`size-1.5 rounded-full bg-current ${type.accent}`} />
        {type.label}
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-gray-900">
        {type.title}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-gray-600">
        {type.description}
      </p>
      <div className="mt-auto pt-5">
        <div
          className={`flex min-h-[140px] items-center justify-center rounded-2xl bg-gradient-to-br ${type.tint} p-4 ring-1 ring-inset ring-white/60 transition-shadow group-hover:shadow-inner`}
        >
          <div className="w-full">{type.preview(hovered)}</div>
        </div>
      </div>
    </StaggerItem>
  );
}

export function ExerciseTypes() {
  return (
    <Section
      id="exercices"
      eyebrow="Exercices"
      title="Cinq formats, toujours ludiques."
      description="Survole les cartes pour voir chaque format en action — pour garder l'attention et varier les plaisirs."
    >
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((type) => (
          <ExerciseCardView key={type.label} type={type} />
        ))}
      </StaggerContainer>
    </Section>
  );
}
