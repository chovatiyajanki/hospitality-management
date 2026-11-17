import { useRef } from "react";
import { cn } from "../../lib/utils";

export function OTPInput({ length = 4, value = "", onChange, className }) {
  const refs = useRef([]);
  const chars = Array.from({ length }, (_, i) => value[i] || "");

  const setAt = (index, digit) => {
    const next = chars.map((c, i) => (i === index ? digit : c));
    onChange?.(next.join(""));
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={char}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, d);
            if (d && refs.current[i + 1]) refs.current[i + 1].focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i] && refs.current[i - 1]) {
              refs.current[i - 1].focus();
            }
          }}
          className="h-12 w-11 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-center text-lg font-bold font-mono outline-none focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/30"
        />
      ))}
    </div>
  );
}
