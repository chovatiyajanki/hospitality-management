import { Check, Clock, Stethoscope, CheckCircle2, Ticket } from "lucide-react";
import { cn } from "../../lib/utils";

const STEP_ICONS = [Ticket, Clock, Clock, Stethoscope, CheckCircle2];

export function Timeline({ steps, current = 0, className }) {
  return (
    <div className={cn("w-full py-2", className)} aria-label="Appointment queue progress">
      <div className="relative">
        {/* Desktop / Tablet progress line */}
        <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-[var(--surface-3)] -z-0 rounded-full" />
        <div
          className="hidden sm:block absolute top-5 left-8 h-1 bg-[#E4572E] -z-0 rounded-full transition-all duration-300"
          style={{
            width: steps.length > 1 ? `${Math.min(100, (current / (steps.length - 1)) * 100)}%` : "0%",
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2">
          {steps.map((step, index) => {
            const complete = index < current;
            const active = index === current;
            const Icon = STEP_ICONS[index] || Clock;

            return (
              <div
                key={step.label || index}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative flex sm:flex-col items-center gap-3 sm:gap-2 p-2.5 sm:p-2 rounded-2xl sm:rounded-none transition-all",
                  active
                    ? "bg-[#E4572E]/10 border border-[#E4572E]/30 dark:bg-[#E4572E]/20 sm:bg-transparent sm:border-0"
                    : "sm:bg-transparent"
                )}
              >
                {/* Node icon circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl sm:rounded-full transition-all shadow-xs",
                    complete
                      ? "bg-[#14213D] text-[#FBF7F0]"
                      : active
                        ? "bg-[#E4572E] text-white ring-4 ring-[#E4572E]/25 scale-105"
                        : "bg-[var(--bg-elevated)] border-2 border-[var(--border)] text-[var(--fg-muted)]"
                  )}
                >
                  {complete ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                  )}
                </div>

                {/* Text details */}
                <div className="min-w-0 flex-1 sm:text-center">
                  <span
                    className={cn(
                      "block text-xs sm:text-[13px] font-bold truncate",
                      active
                        ? "text-[#E4572E] font-extrabold"
                        : complete
                          ? "text-[var(--fg)]"
                          : "text-[var(--fg-muted)]"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.hint && (
                    <p
                      className={cn(
                        "text-[11px] truncate mt-0.5",
                        active
                          ? "text-[#E4572E] font-semibold"
                          : "text-[var(--fg-muted)]"
                      )}
                    >
                      {step.hint}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
