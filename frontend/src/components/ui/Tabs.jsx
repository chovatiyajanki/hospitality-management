import { cn } from "../../lib/utils";

export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cn("flex gap-1 rounded-2xl bg-[var(--surface-2)] p-1", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer",
            value === item.id
              ? "bg-[var(--bg-elevated)] text-[var(--fg)] shadow-[var(--shadow-soft)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
