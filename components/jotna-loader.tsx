"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { kidMessages } from "@/lib/kidCopy";

/**
 * Loader kid-friendly avec animation baobab + messages rotatifs.
 * Decision 86 (UA M3) — affiché pour toutes attentes IA > 500ms.
 *
 * Usage:
 *   <JotnaLoader message="Aïssatou prépare tes exos..." />
 *   <JotnaLoader />  // utilise messages rotatifs
 */
export function JotnaLoader({
  message,
  size = 120,
  className = "",
}: {
  message?: string;
  size?: number;
  className?: string;
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (message) return; // override mode, pas de rotation
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % kidMessages.loaderMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message ?? kidMessages.loaderMessages[messageIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-8 ${className}`}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        initial={{ scale: 0.95 }}
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        aria-label="Baobab loader"
      >
        {/* Baobab tronc */}
        <motion.rect
          x="48"
          y="60"
          width="24"
          height="50"
          rx="4"
          fill="#92400e"
        />
        {/* Branches */}
        <motion.path
          d="M 60 60 Q 30 50 25 35"
          stroke="#92400e"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d="M 60 60 Q 90 50 95 35"
          stroke="#92400e"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d="M 60 55 L 60 25"
          stroke="#92400e"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Feuillage animé */}
        <motion.circle
          cx="25"
          cy="30"
          r="14"
          fill="#22c55e"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        />
        <motion.circle
          cx="60"
          cy="22"
          r="16"
          fill="#16a34a"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.circle
          cx="95"
          cy="30"
          r="14"
          fill="#22c55e"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        />
        {/* Petits fruits */}
        <motion.circle
          cx="50"
          cy="40"
          r="3"
          fill="#f59e0b"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="72"
          cy="38"
          r="3"
          fill="#f59e0b"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.svg>
      <motion.p
        key={displayMessage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-gray-600 text-center max-w-xs"
      >
        {displayMessage}
      </motion.p>
    </div>
  );
}
