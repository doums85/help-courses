"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, X, Lightbulb, WifiOff } from "lucide-react";
import Link from "next/link";

import { JotnaLoader } from "@/components/jotna-loader";
import { StarRating, PalierStarsBar } from "@/components/star-rating";
import { CapRegenAlternatives } from "@/components/cap-regen-alternatives";
import { kidMessages } from "@/lib/kidCopy";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import DragDropExercise from "@/components/exercises/DragDropExercise";
import { motion, AnimatePresence } from "framer-motion";

type SanitizedExo = {
  _id: Id<"exercises">;
  type: "qcm" | "drag-drop" | "match" | "order" | "short-answer";
  prompt: string;
  payload: Record<string, unknown>;
  hintsAvailable: number;
  palierAttemptId: Id<"palierAttempts">;
  isVariation: boolean;
};

type PalierResult = {
  status: "validated" | "failed";
  average: number;
  starsTotal: number;
  threshold: number;
  failedCount: number;
  canRegen: boolean;
  cumulativeRegens: number;
};

export default function TopicSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: topicId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const palierIndex = parseInt(searchParams.get("palier") ?? "1", 10);

  // Wait for Convex auth before querying profile (Decision 99 — anti race-condition)
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );
  const topic = useQuery(api.topics.getById, {
    id: topicId as Id<"topics">,
  });

  const getBucket = useAction(api.paliers.index.getBucket);
  const startAttempt = useMutation(api.paliers.index.startPalierAttempt);
  const verifyAttempt = useMutation(api.palierAttempts.verifyAttempt);
  const requestHint = useMutation(api.palierAttempts.requestHint);
  const submitPalier = useMutation(api.palierAttempts.submitPalier);
  const regenerate = useAction(api.paliers.index.regenerateFailedExercises);

  // Bootstrap state
  const [palierAttemptId, setPalierAttemptId] =
    useState<Id<"palierAttempts"> | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Load exercises (only when palierAttemptId ready)
  const exercises = useQuery(
    api.paliers.index.getExercisesForPalier,
    palierAttemptId ? { palierAttemptId } : "skip",
  ) as SanitizedExo[] | null | undefined;

  // Palier loop state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    attemptsRemaining: number;
  } | null>(null);
  const [hintShown, setHintShown] = useState<{
    text: string;
    index: number;
  } | null>(null);
  const [hintsUsedThisExo, setHintsUsedThisExo] = useState(0);
  const [palierResult, setPalierResult] = useState<PalierResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Network status (Decision 90)
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Bootstrap : getBucket → startAttempt
  useEffect(() => {
    if (!topic || palierAttemptId || bootstrapping) return;
    (async () => {
      setBootstrapping(true);
      setBootstrapError(null);
      try {
        if (!topic.class) {
          setBootstrapError(
            "Cette thématique n'a pas encore de classe assignée.",
          );
          return;
        }
        const bucket = await getBucket({
          subjectId: topic.subjectId,
          class: topic.class as
            | "CI"
            | "CP"
            | "CE1"
            | "CE2"
            | "CM1"
            | "CM2",
          topicId: topicId as Id<"topics">,
          palierIndex,
        });
        const attemptId = await startAttempt({ palierId: bucket.palierId });
        setPalierAttemptId(attemptId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setBootstrapError(msg);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [
    topic,
    palierAttemptId,
    bootstrapping,
    getBucket,
    startAttempt,
    topicId,
    palierIndex,
  ]);

  const handleQuit = useCallback(() => {
    if (
      !window.confirm(
        "Veux-tu vraiment quitter ? Ta progression est sauvegardée.",
      )
    )
      return;
    if (topic?.subjectId) {
      router.push(`/student/subjects/${topic.subjectId}`);
    } else {
      router.push("/student/home");
    }
  }, [router, topic]);

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      if (!exercises || !palierAttemptId) return;
      const exo = exercises[currentIndex];
      if (!exo) return;
      try {
        const res = await verifyAttempt({
          exerciseId: exo._id,
          palierAttemptId,
          userAnswer: answer,
        });
        setFeedback({
          correct: res.isCorrect,
          attemptsRemaining: res.attemptsRemaining,
        });
      } catch (err) {
        console.error(err);
      }
    },
    [exercises, palierAttemptId, currentIndex, verifyAttempt],
  );

  const handleRequestHint = useCallback(async () => {
    if (!exercises || !palierAttemptId) return;
    const exo = exercises[currentIndex];
    if (!exo) return;
    if (hintsUsedThisExo >= exo.hintsAvailable) return;
    try {
      const res = await requestHint({
        exerciseId: exo._id,
        palierAttemptId,
        hintIndex: hintsUsedThisExo,
      });
      setHintShown({ text: res.hint, index: res.hintIndex });
      setHintsUsedThisExo((n) => n + 1);
    } catch (err) {
      console.error(err);
    }
  }, [exercises, palierAttemptId, currentIndex, hintsUsedThisExo, requestHint]);

  const handleNextExo = useCallback(async () => {
    if (!exercises) return;
    setFeedback(null);
    setHintShown(null);
    setHintsUsedThisExo(0);
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    // End of palier — submit
    if (!palierAttemptId) return;
    setSubmitting(true);
    try {
      const res = await submitPalier({ palierAttemptId });
      setPalierResult(res as PalierResult);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [exercises, currentIndex, palierAttemptId, submitPalier]);

  const handleRegen = useCallback(async () => {
    if (!palierAttemptId) return;
    setRegenerating(true);
    try {
      await regenerate({ palierAttemptId });
      setPalierResult(null);
      setCurrentIndex(0);
      setFeedback(null);
      setHintShown(null);
      setHintsUsedThisExo(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      alert(msg);
    } finally {
      setRegenerating(false);
    }
  }, [palierAttemptId, regenerate]);

  // ==== RENDER ====

  // Loading states — wait for auth resolution AND queries
  if (authLoading || (isAuthenticated && profile === undefined) || topic === undefined) {
    return <JotnaLoader />;
  }
  if (!isAuthenticated || profile === null) {
    return (
      <CenteredCard>
        <h2 className="text-xl font-bold">Non connecté</h2>
        <p className="text-gray-500">Connecte-toi pour faire les exercices.</p>
        <Link
          href="/login"
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Se connecter
        </Link>
      </CenteredCard>
    );
  }
  if (!topic) {
    return (
      <CenteredCard>
        <BookOpen className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold">Thématique introuvable</h2>
      </CenteredCard>
    );
  }

  if (bootstrapError) {
    return (
      <CenteredCard>
        <p className="text-base text-red-600">{bootstrapError}</p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl bg-gray-200 px-6 py-2 text-base font-semibold"
        >
          Retour
        </button>
      </CenteredCard>
    );
  }

  if (!palierAttemptId || exercises === undefined) {
    return <JotnaLoader />;
  }
  if (exercises === null || exercises.length === 0) {
    return (
      <CenteredCard>
        <BookOpen className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold">Aucun exercice disponible</h2>
        <button
          onClick={() => router.back()}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Retour
        </button>
      </CenteredCard>
    );
  }

  // Final palier screen
  if (palierResult) {
    const validated = palierResult.status === "validated";
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-3xl p-8 text-center text-white shadow-xl ${
            validated
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
              : "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500"
          }`}
        >
          <h1 className="text-3xl font-extrabold mb-3">
            {validated
              ? kidMessages.palierValidatedShort
              : "Palier non validé"}
          </h1>
          <p className="text-lg opacity-90 mb-4">
            {validated
              ? kidMessages.palierValidated(palierResult.starsTotal)
              : kidMessages.palierFailed(palierResult.starsTotal)}
          </p>
          <div className="mx-auto max-w-sm">
            <PalierStarsBar
              starsTotal={palierResult.starsTotal}
              threshold={palierResult.threshold * 3}
            />
          </div>
        </motion.div>

        {!validated && palierResult.canRegen && !regenerating && (
          <div className="text-center space-y-3">
            <p className="text-base text-gray-700">{kidMessages.regenIntro}</p>
            <button
              onClick={handleRegen}
              className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-8 py-3 text-lg font-bold text-white shadow-lg hover:scale-[1.02] transition-all"
            >
              {kidMessages.regenCta}
            </button>
          </div>
        )}

        {regenerating && (
          <JotnaLoader message={kidMessages.regenLoading} />
        )}

        {!validated && !palierResult.canRegen && (
          <CapRegenAlternatives
            onSeeCorrected={() =>
              router.push(`/student/topics/${topicId}/session?palier=${palierIndex}&review=1`)
            }
            previousPalierHref={
              palierIndex > 1
                ? `/student/topics/${topicId}/session?palier=${palierIndex - 1}`
                : null
            }
            onAskParent={() => {
              alert("Ton parent va recevoir une notification 📩");
              router.push("/student/home");
            }}
          />
        )}

        {validated && (
          <div className="text-center">
            <Link
              href={`/student/topics/${topicId}/session?palier=${palierIndex + 1}`}
              className="inline-block rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-8 py-3 text-lg font-bold text-white shadow-lg hover:scale-[1.02] transition-all"
            >
              Palier suivant 🚀
            </Link>
          </div>
        )}
      </div>
    );
  }

  // In-progress palier player
  const exo = exercises[currentIndex];
  const totalExos = exercises.length;
  const disabled = feedback !== null;

  return (
    <div className="relative mx-auto max-w-2xl py-4">
      {/* Network drop banner (Decision 90) */}
      {!isOnline && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
          <WifiOff className="h-4 w-4" />
          {kidMessages.networkLost}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">
            {topic.name ?? "Palier"} — niveau {palierIndex}
          </span>
          <span className="mx-2">·</span>
          <span>
            Question {currentIndex + 1}/{totalExos}
          </span>
          {exo?.isVariation && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Variation
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleQuit}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-white"
        >
          <X className="h-4 w-4" />
          {kidMessages.cta.quit}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + (feedback?.correct ? 1 : 0)) / totalExos) * 100}%`,
          }}
          className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
        />
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${exo._id}-${feedback?.correct ?? "pending"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl bg-white p-6 shadow-md"
        >
          <ExerciseRenderer
            exo={exo}
            disabled={disabled}
            isCorrect={feedback?.correct ?? null}
            onSubmit={handleSubmitAnswer}
          />

          {/* Hints */}
          {!disabled && exo.hintsAvailable > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleRequestHint}
                disabled={hintsUsedThisExo >= exo.hintsAvailable}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition-all hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lightbulb className="h-4 w-4" />
                Demander un indice ({hintsUsedThisExo}/{exo.hintsAvailable})
              </button>
              {hintsUsedThisExo > 0 && (
                <span className="text-xs italic text-gray-500">
                  {kidMessages.hintLevel(hintsUsedThisExo, exo.hintsAvailable)}
                </span>
              )}
            </div>
          )}

          {/* Hint display */}
          {hintShown && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3"
            >
              <p className="text-sm text-amber-900">
                <span className="font-semibold">
                  Indice {hintShown.index + 1} :
                </span>{" "}
                {hintShown.text}
              </p>
            </motion.div>
          )}

          {/* Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 space-y-3"
            >
              <div
                className={`rounded-xl px-4 py-3 text-center font-semibold ${
                  feedback.correct
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {feedback.correct
                  ? "✅ Bravo !"
                  : feedback.attemptsRemaining > 0
                    ? `Pas tout à fait. Il te reste ${feedback.attemptsRemaining} essai${feedback.attemptsRemaining > 1 ? "s" : ""}.`
                    : "Tu peux passer à la suite."}
              </div>
              {(feedback.correct || feedback.attemptsRemaining === 0) && (
                <button
                  onClick={handleNextExo}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-lg font-bold text-white shadow-lg hover:scale-[1.01] transition-all"
                >
                  {currentIndex < totalExos - 1
                    ? kidMessages.cta.next
                    : submitting
                      ? "..."
                      : "Voir mon résultat"}
                </button>
              )}
              {!feedback.correct && feedback.attemptsRemaining > 0 && (
                <button
                  onClick={() => setFeedback(null)}
                  className="w-full rounded-xl bg-white px-6 py-3 text-base font-semibold text-orange-600 border-2 border-orange-300 hover:bg-orange-50 transition-all"
                >
                  Réessayer
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
      {children}
    </div>
  );
}

function ExerciseRenderer({
  exo,
  disabled,
  isCorrect,
  onSubmit,
}: {
  exo: SanitizedExo;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
}) {
  // Existing components expect payloads with the answer fields; we pass the
  // sanitized payload as-is. They render UI without the answer, which is fine
  // because verification now happens server-side via mutation.
  switch (exo.type) {
    case "qcm":
      return (
        <QcmExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "short-answer":
      return (
        <ShortAnswerExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "match":
      return (
        <MatchExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "order":
      return (
        <OrderExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "drag-drop":
      return (
        <DragDropExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    default:
      return <p>Type d&apos;exercice non supporté</p>;
  }
}
