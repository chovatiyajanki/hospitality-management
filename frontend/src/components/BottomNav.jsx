import { Activity, Search, Stethoscope, Tv, Calendar, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "../context/I18nContext";
import { cn } from "../lib/utils";

const ITEMS = [
  { id: "live-board", icon: Activity, key: "nav.liveShort" },
  { id: "book-appointment", icon: Calendar, key: "nav.bookShort" },
  { id: "my-token", icon: Search, key: "nav.trackShort" },
  { id: "doctor-panel", icon: Stethoscope, key: "nav.deskShort" },
  { id: "tv-screen", icon: Tv, key: "nav.tvShort" },
];

export default function BottomNav({ currentTab, setCurrentTab }) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className="relative mx-auto max-w-lg">
        {/* Floating Quick Book Token Button (when on Live Board) */}
        {currentTab === "live-board" && (
          <button
            type="button"
            onClick={() => setCurrentTab("book-appointment")}
            className="absolute right-3 bottom-[calc(100%+0.85rem)] z-10 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E4572E] hover:bg-[#CC4820] px-4 text-xs font-bold text-white shadow-md shadow-[#E4572E]/30 cursor-pointer active:scale-95 transition-transform"
            aria-label={t("nav.bookToken")}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>{t("nav.bookToken")}</span>
          </button>
        )}

        {/* 5 Bottom Nav Items */}
        <div className="grid grid-cols-5 gap-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                className={cn(
                  "relative flex min-h-[48px] flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors cursor-pointer select-none active:scale-95",
                  active
                    ? "text-[#E4572E] font-bold"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={t(item.key)}
              >
                {active && (
                  <motion.div
                    layoutId={reduceMotion ? undefined : "mobileBottomActivePill"}
                    className="absolute inset-0 rounded-xl bg-[#E4572E]/10 dark:bg-[#E4572E]/20"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
                <Icon className={cn("relative z-10 h-5 w-5", active ? "stroke-[2.3]" : "stroke-[1.75]")} />
                <span className="relative z-10 text-[10px] tracking-tight">{t(item.key)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
