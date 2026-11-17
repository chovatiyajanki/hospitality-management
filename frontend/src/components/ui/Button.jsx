import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-[#E4572E] hover:bg-[#CC4820] text-white shadow-sm hover:shadow-[var(--shadow-coral)] active:scale-[0.97]",
  secondary:
    "bg-[var(--surface-1)] text-[#14213D] dark:text-[#FBF7F0] border border-[var(--border)] hover:bg-[#F5EFE6] dark:hover:bg-[#1D2D4F] hover:border-[#14213D]/30 active:scale-[0.97]",
  ink:
    "bg-[#14213D] hover:bg-[#0E1628] text-[#FBF7F0] shadow-sm hover:shadow active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--fg-secondary)] hover:bg-[#F5EFE6] dark:hover:bg-[#1D2D4F] hover:text-[var(--fg)] active:scale-[0.97]",
  danger:
    "bg-[#E4572E] hover:bg-[#CC4820] text-white shadow-sm hover:shadow active:scale-[0.97]",
  outline:
    "bg-transparent text-[#E4572E] border border-[#E4572E]/50 hover:bg-[#E4572E]/10 active:scale-[0.97]",
  morning:
    "bg-[#F4A62A] hover:bg-[#D68B17] text-[#14213D] font-bold shadow-sm hover:shadow-[var(--shadow-saffron)] active:scale-[0.97]",
  evening:
    "bg-[#CFE0F3] hover:bg-[#B5CDE8] text-[#183D6D] font-bold border border-[#B5CDE8] active:scale-[0.97]",
};

const sizes = {
  sm: "min-h-[38px] px-3.5 py-1.5 text-xs rounded-lg gap-1.5",
  md: "min-h-[44px] px-4 py-2 text-sm rounded-xl gap-2",
  lg: "min-h-[48px] px-6 py-2.5 text-base rounded-xl gap-2.5",
  icon: "h-11 w-11 p-0 rounded-xl justify-center",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4572E] focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none",
        "motion-reduce:transition-none motion-reduce:transform-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" strokeWidth={2.2} />
      ) : null}
      {children}
    </button>
  );
}
