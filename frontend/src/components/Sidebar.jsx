import { useEffect } from "react";
import {
  Cross,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Tooltip } from "./ui";
import { useI18n } from "../context/I18nContext";
import { cn } from "../lib/utils";
import { TABS } from "../constants/navigation";

export default function Sidebar({
  currentTab,
  setCurrentTab,
  statusData,
  settings,
  isCollapsed = false,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, setIsMobileOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleSelectTab = (id) => {
    setCurrentTab(id);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Shared Navigation list content
  const renderNavItems = (collapsed = false) => (
    <nav className="space-y-1.5 px-2.5" aria-label="Sidebar Main Navigation">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = currentTab === tab.id;
        const label = t(tab.labelKey);

        const buttonElement = (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelectTab(tab.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex w-full items-center rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
              collapsed ? "justify-center px-2" : "gap-3 px-3.5",
              active
                ? "bg-[#14213D] text-[#FBF7F0] dark:bg-[#FBF7F0] dark:text-[#14213D] shadow-sm"
                : "text-[var(--fg-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
            )}
          >
            {/* Framer motion active indicator */}
            {active && (
              <motion.div
                layoutId={reduceMotion ? undefined : "sidebarActiveIndicator"}
                className="absolute inset-0 rounded-xl bg-[#14213D] dark:bg-[#FBF7F0]"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}

            <Icon
              className={cn(
                "relative z-10 shrink-0 h-4 w-4 transition-transform duration-150",
                active
                  ? "stroke-[2.2] scale-105"
                  : "stroke-[1.9] text-[var(--fg-muted)] group-hover:text-[var(--fg)]"
              )}
            />

            {!collapsed && (
              <span className="relative z-10 flex-1 truncate text-left font-medium">
                {label}
              </span>
            )}

            {/* Live Serving Token Tag (Live Board) */}
            {!collapsed && tab.id === "live-board" && statusData?.current_serving_token && (
              <span
                className={cn(
                  "relative z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono transition-colors",
                  active
                    ? "bg-[#E4572E] text-white"
                    : "bg-[#CFE0F3] text-[#183D6D] dark:bg-[#CFE0F3]/30 dark:text-[#CFE0F3]"
                )}
              >
                #{statusData.current_serving_token}
              </span>
            )}

            {/* TV Mode Badge */}
            {!collapsed && tab.id === "tv-screen" && (
              <span
                className={cn(
                  "relative z-10 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-[var(--surface-3)] text-[var(--fg-muted)]"
                )}
              >
                TV
              </span>
            )}
          </button>
        );

        if (collapsed) {
          return (
            <Tooltip key={tab.id} content={label} side="right">
              {buttonElement}
            </Tooltip>
          );
        }

        return buttonElement;
      })}
    </nav>
  );

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP STICKY SIDEBAR HEADER                         */}
      {/* ======================================================== */}
      <aside
        className={cn(
          "no-print hidden md:flex flex-col shrink-0 sticky top-0 h-screen z-40 border-r border-[var(--border)] bg-[var(--surface-1)] transition-[width] duration-300 select-none",
          isCollapsed ? "w-[72px]" : "w-[260px] lg:w-[272px]"
        )}
      >
        {/* Brand / Clinic Header inside Sidebar */}
        <div className="flex min-h-[70px] sm:min-h-[74px] items-center justify-between border-b border-[var(--border)] px-4">
          <button
            type="button"
            onClick={() => setCurrentTab("live-board")}
            className={cn(
              "flex items-center text-left cursor-pointer group min-w-0",
              isCollapsed ? "justify-center w-full" : "gap-3"
            )}
            aria-label={`${settings?.clinic_name || "Gurukrupa Clinic"} — ${t("nav.live")}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4572E] text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
              <Cross className="h-5 w-5" strokeWidth={2.4} />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-display text-base font-normal tracking-tight text-[var(--fg)] truncate block">
                  {settings?.clinic_name || "Gurukrupa Clinic"}
                </span>
                <span className="block text-[10px] font-medium text-[var(--fg-muted)] tracking-wider uppercase truncate">
                  {t("brandTag") || "Online Tokens & Queue"}
                </span>
              </div>
            )}
          </button>

          {/* Collapse/Expand Toggle Button */}
          {!isCollapsed && setIsCollapsed && (
            <Tooltip content="Collapse sidebar" side="right">
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Expand toggle when collapsed */}
        {isCollapsed && setIsCollapsed && (
          <div className="flex justify-center py-2 border-b border-[var(--border)]">
            <Tooltip content="Expand sidebar" side="right">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!isCollapsed && (
            <div className="px-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fg-muted)] block">
                Menu
              </span>
            </div>
          )}

          {renderNavItems(isCollapsed)}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE DRAWER SIDEBAR                                 */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Sliding Mobile Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[min(84vw,320px)] flex flex-col border-r border-[var(--border)] bg-[var(--surface-1)] shadow-2xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
            >
              {/* Drawer Header */}
              <div className="flex min-h-[64px] items-center justify-between border-b border-[var(--border)] px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4572E] text-white">
                    <Cross className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-display text-sm font-normal text-[var(--fg)] truncate block">
                      {settings?.clinic_name || "Gurukrupa Clinic"}
                    </span>
                    <span className="block text-[10px] font-medium text-[var(--fg-muted)] tracking-wider uppercase truncate">
                      {t("brandTag") || "Online Tokens & Queue"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="px-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fg-muted)] block">
                    Menu
                  </span>
                </div>

                {renderNavItems(false)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
