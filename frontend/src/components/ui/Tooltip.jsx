import { cn } from "../../lib/utils";

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}) {
  if (!content) return children;

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  }[side] || "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-semibold",
          "bg-[#14213D] text-[#FBF7F0] border border-[#263654] shadow-lg",
          "opacity-0 scale-95 transition-all duration-150 ease-out",
          "group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100",
          sideClasses
        )}
      >
        {content}
      </span>
    </span>
  );
}
