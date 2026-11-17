import { useEffect, useState, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../lib/utils";

/**
 * AnimatedBackground (Warm Care Edition)
 * Hand-crafted, tactile ambient background with paper grain and warm medical touches.
 * Zero neon, zero purple gradients, zero green.
 */
export default function AnimatedBackground({
  variant = "aurora",
  showMedicalShapes = false,
  speed = "normal",
  disabled = false,
  className,
}) {
  const prefersReduced = useReducedMotion();
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const durationStyle = useMemo(() => {
    if (disabled || prefersReduced || !isTabVisible) {
      return { animationPlayState: "paused" };
    }
    const speeds = {
      slow: { "--warm-duration": "60s" },
      normal: { "--warm-duration": "40s" },
      fast: { "--warm-duration": "25s" },
    };
    return speeds[speed] || speeds.normal;
  }, [disabled, prefersReduced, isTabVisible, speed]);

  return (
    <div
      aria-hidden="true"
      style={durationStyle}
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none",
        (!isTabVisible || disabled || prefersReduced) && "bg-anim-paused",
        className
      )}
    >
      {/* 1. AURORA VARIANT (Warm Care Patient Pages: Saffron, Sky & Warm Amber) */}
      {variant === "aurora" && (
        <div className="relative h-full w-full opacity-40 dark:opacity-25 transition-opacity duration-700">
          {/* Subtle Warm Saffron Glow (Top-Left) */}
          <div
            className="absolute -top-[15%] -left-[10%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-gradient-to-br from-[#F4A62A]/15 via-[#FBF7F0]/30 to-transparent blur-[90px]"
          />

          {/* Soft Sky Blue Glow (Bottom-Right, Evening Session Comfort) */}
          <div
            className="absolute -bottom-[15%] -right-[10%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-gradient-to-tl from-[#CFE0F3]/25 via-transparent to-transparent blur-[90px]"
          />

          {/* Delicate Coral Accent (Top-Right, very subtle) */}
          <div
            className="hidden sm:block absolute top-[20%] -right-[5%] h-[35vw] w-[35vw] max-h-[400px] max-w-[400px] rounded-full bg-[#E4572E]/5 blur-[80px]"
          />
        </div>
      )}

      {/* 2. MESH VARIANT (Doctor & Reception Desk) */}
      {variant === "mesh" && (
        <div className="relative h-full w-full">
          {/* Faint Dotted Paper Grid */}
          <div
            className="absolute inset-0 opacity-[0.045] dark:opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1.2px, transparent 1.2px)`,
              backgroundSize: "24px 24px",
            }}
          />
          {/* Gentle Corner Warmth */}
          <div className="absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-[#F4A62A]/10 blur-[80px]" />
          <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-[#CFE0F3]/15 blur-[80px]" />
        </div>
      )}

      {/* 3. TV VARIANT (Waiting Room TV Signage: Deep Ink #0E1628) */}
      {variant === "tv" && (
        <div className="relative h-full w-full bg-[#0E1628] overflow-hidden">
          {/* Faint Concentric Pulse Rings in Warm Saffron */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="h-[45vw] w-[45vw] min-h-[500px] min-w-[500px] rounded-full border border-[#F4A62A]/10 opacity-60" />
            <div className="absolute inset-0 rounded-full border border-[#E4572E]/10 scale-125 opacity-40" />
          </div>

          {/* Deep Ambient Ink Glows */}
          <div className="absolute -top-1/4 left-1/4 h-[50vw] w-[50vw] rounded-full bg-[#14213D] blur-[100px]" />
          <div className="absolute -bottom-1/4 right-1/4 h-[50vw] w-[50vw] rounded-full bg-[#18243F] blur-[100px]" />
        </div>
      )}

      {/* 4. TACTILE MEDICAL TOUCHES: Hand-crafted ECG Heartbeat Line & Warm Plus (5-7% opacity) */}
      {showMedicalShapes && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06] dark:opacity-[0.08]">
          {/* Warm Medical Cross (Top-Left) */}
          <svg
            className="absolute top-[16%] left-[6%] h-10 w-10 text-[#14213D] dark:text-[#FBF7F0]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 4a1 1 0 0 1 2 0v6h6a1 1 0 0 1 0 2h-6v6a1 1 0 0 1-2 0v-6H4a1 1 0 0 1 0-2h6V4z" />
          </svg>

          {/* Heartbeat ECG Line (Bottom-Left) */}
          <svg
            className="hidden sm:block absolute bottom-[22%] left-[10%] h-12 w-32 text-[#E4572E] dark:text-[#E4572E]"
            viewBox="0 0 120 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0 16 h30 L38 4 L48 28 L56 10 L64 22 L70 16 h50" />
          </svg>

          {/* Warm Medical Cross (Bottom-Right) */}
          <svg
            className="absolute top-[68%] right-[8%] h-8 w-8 text-[#F4A62A]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 4a1 1 0 0 1 2 0v6h6a1 1 0 0 1 0 2h-6v6a1 1 0 0 1-2 0v-6H4a1 1 0 0 1 0-2h6V4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
