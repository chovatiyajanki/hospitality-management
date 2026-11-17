import { Card } from "./Card";
import { cn } from "../../lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  suffix,
  tone = "coral",
  className,
}) {
  const iconTones = {
    coral:
      "bg-[#E4572E]/10 text-[#E4572E] dark:bg-[#E4572E]/20 dark:text-[#FFA387]",
    saffron:
      "bg-[#F4A62A]/15 text-[#B87104] dark:bg-[#F4A62A]/20 dark:text-[#F4A62A]",
    sky:
      "bg-[#CFE0F3] text-[#183D6D] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3]",
    ink:
      "bg-[#14213D]/10 text-[#14213D] dark:bg-[#14213D]/40 dark:text-[#FBF7F0]",
    slate:
      "bg-[#F5EFE6] text-[#5B6475] dark:bg-[#1D2D4F] dark:text-[#CBD5E1]",
  };

  return (
    <Card className={cn("p-4 sm:p-5 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-[var(--fg-muted)] tracking-wider uppercase">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconTones[tone] || iconTones.coral
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--fg)] tracking-tight">
            <AnimatedNumber value={value} />
          </div>
          {suffix && (
            <span className="text-xs font-semibold text-[var(--fg-muted)]">
              {suffix}
            </span>
          )}
        </div>
        {hint && (
          <p className="mt-1 text-[11px] font-medium text-[var(--fg-muted)]">
            {hint}
          </p>
        )}
      </div>
    </Card>
  );
}
