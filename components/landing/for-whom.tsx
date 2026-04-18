import {
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Section } from "./section";

type Persona = {
  icon: LucideIcon;
  title: string;
  tagline: string;
  color: string;
  bulletColor: string;
  points: string[];
  featured?: boolean;
};

const PERSONAS: Persona[] = [
  {
    icon: BookOpen,
    title: "Pour les enfants",
    tagline: "Apprendre en s'amusant",
    color: "bg-amber-500",
    bulletColor: "bg-amber-400",
    points: [
      "Des exercices courts et variés",
      "Des badges pour chaque étape",
      "Une jauge de progression visuelle",
    ],
  },
  {
    icon: Heart,
    title: "Pour les parents",
    tagline: "Suivre sans surveiller",
    color: "bg-lime-600",
    bulletColor: "bg-lime-500",
    featured: true,
    points: [
      "Tableau de bord pour plusieurs enfants",
      "Rapports clairs par chapitre",
      "Notifications quand un badge est gagné",
      "Temps d'écran maîtrisé",
    ],
  },
  {
    icon: GraduationCap,
    title: "Pour les professeurs",
    tagline: "Guider collectivement",
    color: "bg-orange-500",
    bulletColor: "bg-orange-400",
    points: [
      "Suivi individuel des élèves",
      "Détection des difficultés récurrentes",
      "Contenus validés avant publication",
    ],
  },
];

export function ForWhom() {
  return (
    <Section
      id="pour-qui"
      eyebrow="Pour qui"
      title="Un outil pensé pour toute la famille."
      description="Chaque rôle dispose de son espace. Les enfants apprennent, les adultes accompagnent."
    >
      <div className="grid items-stretch gap-4 md:grid-cols-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isFeatured = p.featured;

          return (
            <div
              key={p.title}
              className={
                isFeatured
                  ? "group relative overflow-hidden rounded-3xl border-2 border-lime-400 bg-gradient-to-br from-lime-50 via-white to-emerald-50/50 p-7 shadow-[0_20px_60px_-20px_rgba(101,163,13,0.35)] transition-all md:-translate-y-3 hover:-translate-y-4 hover:shadow-[0_25px_70px_-20px_rgba(101,163,13,0.45)]"
                  : "group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg"
              }
            >
              {isFeatured && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-lime-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  <Sparkles className="size-3" aria-hidden />
                  Le + utilisé
                </span>
              )}

              <div className="flex items-center">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl ${p.color} text-white shadow-sm ${
                    isFeatured ? "ring-4 ring-lime-200" : ""
                  }`}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
              </div>

              <h3
                className={`mt-6 font-extrabold text-gray-900 ${
                  isFeatured ? "text-2xl" : "text-xl"
                }`}
              >
                {p.title}
              </h3>
              <p
                className={`mt-1 text-sm font-medium ${
                  isFeatured ? "text-lime-700" : "text-gray-500"
                }`}
              >
                {p.tagline}
              </p>

              <ul className="mt-5 space-y-2.5">
                {p.points.map((point) => (
                  <li
                    key={point}
                    className={`flex items-start gap-2.5 text-sm ${
                      isFeatured ? "text-gray-700" : "text-gray-600"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-[7px] size-1.5 flex-none rounded-full ${
                        isFeatured ? p.bulletColor : "bg-gray-300"
                      }`}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
