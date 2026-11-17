import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export function Stepper({ steps, current = 0, className }) {
  return (
    <div className={cn("w-full py-2", className)} aria-label="Step progress">
      <div className="flex items-center justify-between relative">
        {/* Connecting line behind circles */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[var(--surface-3)] -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-[#E4572E] -z-0 transition-all duration-300"
          style={{
            width: steps.length > 1 ? `${(current / (steps.length - 1)) * 100}%` : "0%",
          }}
        />

        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div
              key={step.label || i}
              className="flex flex-col items-center relative z-10 flex-1 px-1"
            >
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 shadow-sm",
                  done
                    ? "bg-[#14213D] text-[#FBF7F0]"
                    : active
                      ? "bg-[#E4572E] text-white ring-4 ring-[#E4572E]/20 scale-105"
                      : "bg-[var(--bg-elevated)] border-2 border-[var(--border)] text-[var(--fg-muted)]"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-center text-[11px] sm:text-xs font-bold transition-colors line-clamp-1",
                  active
                    ? "text-[#E4572E] font-extrabold"
                    : done
                      ? "text-[var(--fg)]"
                      : "text-[var(--fg-muted)]"
                )}
              >
                {step.label}
              </span>
              {step.hint && (
                <span className="hidden sm:block text-[10px] text-[var(--fg-muted)] text-center">
                  {step.hint}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
