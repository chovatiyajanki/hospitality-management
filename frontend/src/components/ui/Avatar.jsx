import { cn } from "../../lib/utils";

export function Avatar({ name = "", className }) {
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-[#14213D] text-xs font-bold text-[#FBF7F0] border border-[#14213D]/10 dark:bg-[#1D2D4F]",
        className
      )}
    >
      {initials || "GK"}
    </div>
  );
}
