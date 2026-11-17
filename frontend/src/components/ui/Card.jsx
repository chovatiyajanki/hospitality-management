import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Flat, solid cards with a fine 1px border (#EAE2D3).
 * No repetitive glassmorphism; clean tactile surfaces with varied weights.
 */
export function Card({
  className,
  hover = false,
  variant = "default", // "default" | "ink" | "warm" | "subtle"
  children,
  as: Comp = "div",
  ...props
}) {
  const reduceMotion = useReducedMotion();

  const variantStyles = {
    default: "bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-card)] text-[var(--fg)]",
    ink: "bg-[#14213D] dark:bg-[#0E1628] border border-[#14213D]/20 dark:border-[#263654] text-[#FBF7F0] shadow-[var(--shadow-lift)]",
    warm: "bg-[#F5EFE6] dark:bg-[#1D2D4F] border border-[var(--border)] text-[var(--fg)] shadow-[var(--shadow-subtle)]",
    subtle: "bg-transparent border border-[var(--border)] text-[var(--fg)]",
  };

  const classes = cn(
    "rounded-xl sm:rounded-2xl transition-all duration-200",
    variantStyles[variant] || variantStyles.default,
    hover &&
      "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:border-[#14213D]/30 dark:hover:border-[#FBF7F0]/30 cursor-pointer motion-reduce:hover:translate-y-0",
    className
  );

  if (hover) {
    return (
      <motion.div
        className={classes}
        whileHover={reduceMotion ? undefined : { y: -2 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Comp className={classes} {...props}>
      {children}
    </Comp>
  );
}
