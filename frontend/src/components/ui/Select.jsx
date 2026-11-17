import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export function Select({ className, children, error, id, ...props }) {
  return (
    <div className="relative w-full">
      <select
        id={id}
        className={cn(
          "w-full min-h-[46px] appearance-none rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 pr-10 text-sm font-medium text-[var(--fg)] outline-none transition-all duration-200 cursor-pointer",
          "hover:border-[#14213D]/30 dark:hover:border-[#FBF7F0]/30",
          "focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/20",
          error && "border-[#E4572E] focus:border-[#E4572E] focus:ring-[#E4572E]/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--fg-muted)]">
        <ChevronDown className="h-4 w-4" strokeWidth={2} />
      </div>
    </div>
  );
}
