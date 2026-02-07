import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import logoFull from "@/assets/logo-collabcrea-full.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("text"), 1000);
    const timer2 = setTimeout(() => setPhase("exit"), 4200);
    const timer3 = setTimeout(() => onComplete(), 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  // Generate sparkle positions
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.cos((i / 12) * Math.PI * 2) * 120,
    y: Math.sin((i / 12) * Math.PI * 2) * 120,
    delay: i * 0.08,
    size: Math.random() * 8 + 4,
  }));

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, hsl(270, 50%, 8%) 0%, hsl(270, 60%, 12%) 50%, hsl(45, 80%, 10%) 100%)",
            }}
            animate={{
              background: [
                "linear-gradient(135deg, hsl(270, 50%, 8%) 0%, hsl(270, 60%, 12%) 50%, hsl(45, 80%, 10%) 100%)",
                "linear-gradient(180deg, hsl(270, 50%, 10%) 0%, hsl(270, 60%, 15%) 50%, hsl(45, 80%, 12%) 100%)",
                "linear-gradient(135deg, hsl(270, 50%, 8%) 0%, hsl(270, 60%, 12%) 50%, hsl(45, 80%, 10%) 100%)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Radial glow behind logo */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsla(45, 80%, 50%, 0.15) 0%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.8, 0.5] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Purple accent glow */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsla(270, 70%, 50%, 0.2) 0%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0, x: -50 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.6, 0.4], x: -50 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          />

          {/* Sparkles */}
          <div className="absolute">
            {sparkles.map((sparkle) => (
              <motion.div
                key={sparkle.id}
                className="absolute rounded-full"
                style={{
                  width: sparkle.size,
                  height: sparkle.size,
                  background: "linear-gradient(135deg, hsl(45, 80%, 60%), hsl(45, 80%, 80%))",
                  boxShadow: "0 0 10px hsla(45, 80%, 60%, 0.8)",
                  left: "50%",
                  top: "50%",
                  marginLeft: -sparkle.size / 2,
                  marginTop: -sparkle.size / 2,
                }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: [0, sparkle.x * 1.5],
                  y: [0, sparkle.y * 1.5],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: 0.5 + sparkle.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Rotating ring */}
          <motion.div
            className="absolute w-[280px] h-[280px] rounded-full border-2 border-gold/30"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ 
              scale: [0, 1.2, 1], 
              opacity: [0, 0.5, 0.3],
              rotate: 360 
            }}
            transition={{ 
              scale: { duration: 1, ease: "easeOut" },
              opacity: { duration: 1, ease: "easeOut" },
              rotate: { duration: 8, repeat: Infinity, ease: "linear" }
            }}
          />

          {/* Second rotating ring (opposite direction) */}
          <motion.div
            className="absolute w-[320px] h-[320px] rounded-full border border-accent/20"
            style={{ borderStyle: "dashed" }}
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ 
              scale: [0, 1.1, 1], 
              opacity: [0, 0.4, 0.2],
              rotate: -360 
            }}
            transition={{ 
              scale: { duration: 1.2, ease: "easeOut" },
              opacity: { duration: 1.2, ease: "easeOut" },
              rotate: { duration: 12, repeat: Infinity, ease: "linear" }
            }}
          />

          {/* Logo container */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            {/* Logo with glow effect */}
            <motion.div
              className="relative"
              animate={{
                filter: [
                  "drop-shadow(0 0 20px hsla(45, 80%, 50%, 0.3))",
                  "drop-shadow(0 0 40px hsla(45, 80%, 50%, 0.5))",
                  "drop-shadow(0 0 20px hsla(45, 80%, 50%, 0.3))",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img
                src={logoFull}
                alt="CollabCréa"
                className="h-32 md:h-44 w-auto"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </motion.div>

            {/* Slogan */}
            <motion.p
              className="mt-8 text-base md:text-xl text-foreground/90 font-medium tracking-wide text-center max-w-md px-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: phase === "text" ? 1 : 0, y: phase === "text" ? 0 : 15 }}
              transition={{ duration: 0.6 }}
            >
              Connectez votre marque aux voix qui comptent.
            </motion.p>

            {/* Loading bar */}
            <motion.div
              className="mt-8 w-48 h-0.5 bg-muted/20 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--accent)))",
                }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>

          {/* Corner decorations */}
          <motion.div
            className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-gold/20 rounded-tl-xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
          <motion.div
            className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-gold/20 rounded-tr-xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          />
          <motion.div
            className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-accent/20 rounded-bl-xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-accent/20 rounded-br-xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
