import { cn } from "../../lib/utils";

const tones = {
  // Available: Sky/Ink per Warm Care spec (NO GREEN)
  available:
    "bg-[#CFE0F3] text-[#183D6D] border-[#B5CDE8] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3] dark:border-[#CFE0F3]/30",
  success:
    "bg-[#CFE0F3] text-[#183D6D] border-[#B5CDE8] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3] dark:border-[#CFE0F3]/30",
  // Saffron: Morning / Filling fast
  morning:
    "bg-[#F4A62A]/15 text-[#9E5F00] border-[#F4A62A]/40 dark:bg-[#F4A62A]/20 dark:text-[#F4A62A] dark:border-[#F4A62A]/30 font-semibold",
  warning:
    "bg-[#F4A62A]/15 text-[#9E5F00] border-[#F4A62A]/40 dark:bg-[#F4A62A]/20 dark:text-[#F4A62A] dark:border-[#F4A62A]/30",
  // Sky: Evening session
  evening:
    "bg-[#CFE0F3] text-[#183D6D] border-[#B5CDE8] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3] dark:border-[#CFE0F3]/30",
  // Coral: Full / Urgent / Now Serving
  danger:
    "bg-[#E4572E]/10 text-[#C93B12] border-[#E4572E]/30 dark:bg-[#E4572E]/25 dark:text-[#FFA387] dark:border-[#E4572E]/40 font-bold",
  live:
    "bg-[#E4572E]/10 text-[#C93B12] border-[#E4572E]/30 dark:bg-[#E4572E]/25 dark:text-[#FFA387] dark:border-[#E4572E]/40 font-bold",
  // Muted: Closed / Secondary
  muted:
    "bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)]",
  inverse:
    "bg-[#FBF7F0]/15 text-[#FBF7F0] border-white/20",
  ink:
    "bg-[#14213D] text-[#FBF7F0] border-[#14213D]/20",
  info:
    "bg-[#CFE0F3] text-[#183D6D] border-[#B5CDE8]",
};

export function Badge({ tone = "muted", className, children, pulse = false }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-normal select-none tracking-wide",
        tones[tone] || tones.muted,
        className
      )}
    >
      {pulse && (
        <span className="live-beacon relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E4572E] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E4572E]" />
        </span>
      )}
      {children}
    </span>
  );
}

export const StatusPill = Badge;
