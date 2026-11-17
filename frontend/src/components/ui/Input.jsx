import { cn } from "../../lib/utils";

export function Input({
  icon: Icon,
  prefix,
  suffix,
  error,
  className,
  id,
  ...props
}) {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--fg-muted)]">
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        </div>
      )}
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs sm:text-sm font-bold text-[var(--fg-muted)]">
          {prefix}
        </span>
      )}
      <input
        id={id}
        className={cn(
          "w-full min-h-[46px] rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)]/70 outline-none transition-all duration-200",
          "hover:border-[#14213D]/30 dark:hover:border-[#FBF7F0]/30",
          "focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/20",
          Icon && "pl-10",
          prefix && "pl-14",
          suffix && "pr-10",
          error && "border-[#E4572E] focus:border-[#E4572E] focus:ring-[#E4572E]/20",
          className
        )}
        {...props}
      />
      {suffix && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--fg-muted)]">
          {suffix}
        </div>
      )}
    </div>
  );
}

export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[96px] rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)]/70 outline-none transition-all duration-200",
        "hover:border-[#14213D]/30 dark:hover:border-[#FBF7F0]/30",
        "focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/20",
        error && "border-[#E4572E] focus:border-[#E4572E] focus:ring-[#E4572E]/20",
        className
      )}
      {...props}
    />
  );
}
