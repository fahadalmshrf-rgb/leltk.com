import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Splash({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);  // Show "ليلتك"
    const t2 = setTimeout(() => setStage(2), 2690); // Show subtitle 1.89s after "ليلتك"
    const t3 = setTimeout(() => onComplete(), 8000); // Complete splash

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-primary overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Radiant glow behind the title */}
        <motion.div
          className="absolute h-[40rem] w-[40rem] rounded-full bg-accent/25 blur-3xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: stage >= 1 ? 1 : 0,
            opacity: stage >= 1 ? 1 : 0,
          }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        <div className="relative flex flex-col items-center justify-center gap-4">
          <motion.h1
            className="font-bold text-accent text-center"
            style={{
              fontFamily: "'Aref Ruqaa', serif",
              fontSize: "clamp(5rem, 18vw, 13rem)",
              textShadow: "0 0 40px hsl(var(--accent) / 0.6)",
            }}
            initial={{ opacity: 0, scale: 0.2, filter: "blur(20px)" }}
            animate={{
              opacity: stage >= 1 ? 1 : 0,
              scale: stage >= 1 ? 1 : 0.2,
              filter: stage >= 1 ? "blur(0px)" : "blur(20px)",
            }}
            transition={{
              duration: 1.1,
              type: "spring",
              stiffness: 90,
              damping: 12,
            }}
          >
            ليلتك
          </motion.h1>

          {/* Subtitle fading in smoothly 1.89 seconds later */}
          <motion.p
            className="text-accent/90 text-center font-medium"
            style={{
              fontSize: "clamp(1.2rem, 3.5vw, 2.2rem)",
            }}
            initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
            animate={{
              opacity: stage >= 2 ? 1 : 0,
              y: stage >= 2 ? 0 : 15,
              filter: stage >= 2 ? "blur(0px)" : "blur(10px)",
            }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
            }}
          >
            منصة متخصصة تجهيز حفلات الأفراح
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}