import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export function ProgressBar({ value = 0, tone = "primary", className }) {
  const reduceMotion = useReducedMotion();
  const colors = {
    primary: "bg-[#E4572E]",
    danger: "bg-[#E4572E]",
    evening: "bg-[#7DA2CC]",
    morning: "bg-[#F4A62A]",
  };

  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-[var(--surface-2)] p-0.5", className)}>
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", colors[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
      />
    </div>
  );
}
