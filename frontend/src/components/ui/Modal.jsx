import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  maxWidth = "max-w-lg",
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose?.();
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : "Modal dialog"}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm -z-10"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={reduceMotion ? false : { y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            className={cn(
              "relative my-auto max-h-[92vh] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-7 shadow-[var(--shadow-lift)]",
              maxWidth,
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="mb-5 flex items-start justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto max-h-[calc(92vh-100px)] pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, children }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) onClose?.();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={reduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", damping: 28, stiffness: 280 }
            }
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lift)]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--fg)]">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-[var(--fg-muted)] hover:bg-[var(--surface-2)] cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
