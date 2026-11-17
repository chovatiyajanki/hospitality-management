import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export function TokenNumber({
  value,
  className,
  flashOnChange = true,
  showPulseRing = false,
}) {
  const reduce = useReducedMotion();
  const display = value ? `#${value}` : "--";
  const prevValue = useRef(value);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (flashOnChange && value && prevValue.current !== value && prevValue.current !== undefined) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 950);
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value, flashOnChange]);

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-visible token-num select-none",
        isFlashing && "animate-token-flash",
        className
      )}
    >
      {/* Soft pulse ring behind the token number */}
      {showPulseRing && value && (
        <span
          aria-hidden="true"
          className="absolute -inset-4 rounded-full border border-[#E4572E]/40 animate-ping opacity-35 pointer-events-none"
        />
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={reduce ? false : { y: "45%", opacity: 0, scale: 0.9, rotateX: -25 }}
          animate={{ y: "0%", opacity: 1, scale: 1, rotateX: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "-45%", opacity: 0, scale: 0.9, rotateX: 25 }}
          transition={{
            duration: reduce ? 0 : 0.36,
            ease: [0.16, 1, 0.3, 1], // easeOutExpo
          }}
          className="inline-block transform-gpu"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
