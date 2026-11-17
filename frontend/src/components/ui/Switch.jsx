import { cn } from "../../lib/utils";

export function Switch({ checked, onChange, label, ariaLabel, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
      onClick={() => onChange(!checked)}
      className={cn("inline-flex items-center gap-2 text-xs font-semibold text-[var(--fg-muted)] cursor-pointer", className)}
    >
      <span
        className={cn(
          "relative h-6 w-10 rounded-full transition",
          checked ? "bg-[#E4572E]" : "bg-[var(--surface-3)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
