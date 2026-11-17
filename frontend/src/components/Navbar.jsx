import {
  Menu,
  Sun,
  Moon,
  Cross,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Tooltip } from "./ui";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../lib/utils";
import { TABS } from "../constants/navigation";

export default function Navbar({
  currentTab,
  setCurrentTab,
  statusData,
  settings,
  wsConnected = true,
  onOpenMobileSidebar,
}) {
  const { t, lang, setLang } = useI18n();
  const { isDark, toggle } = useTheme();

  const isMorning = statusData?.active_session !== "EVENING";
  const doctorKey = statusData?.doctor_status || "AVAILABLE";
  const doctorAvailable = doctorKey === "AVAILABLE";
  const doctorLabel = t(`doctor.${doctorKey}`);

  const compactDoctorLabel =
    {
      AVAILABLE: "Available",
      IN_CONSULTATION: "Consulting",
      ON_BREAK: "On Break",
      OFF_DUTY: "Off Duty",
    }[doctorKey] || "Available";

  const currentTabMeta = TABS.find((tab) => tab.id === currentTab) || TABS[0];
  const CurrentIcon = currentTabMeta.icon;

  return (
    <header className="no-print sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--glass-nav)] backdrop-blur-md transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[58px] sm:min-h-[62px] items-center justify-between gap-3">
          {/* Left: Mobile Menu Button + Brand on Mobile */}
          <div className="flex md:hidden items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("live-board")}
              className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
              aria-label={settings?.clinic_name || "Gurukrupa Clinic"}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E4572E] text-white">
                <Cross className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <span className="font-display text-sm font-normal tracking-tight text-[var(--fg)] truncate">
                {settings?.clinic_name || "Gurukrupa Clinic"}
              </span>
            </button>
          </div>

          {/* Left: Desktop Active View Breadcrumb Indicator */}
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E4572E]/10 text-[#E4572E]">
              <CurrentIcon className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[var(--fg)] tracking-tight block">
                {t(currentTabMeta.labelKey)}
              </span>
            </div>
          </div>

          {/* Right Header Status, Preferences & Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live WebSocket Status Pill (Sky / Ink for Live, Saffron for retry, ZERO GREEN) */}
            <Tooltip side="bottom" content={wsConnected ? "Live connection synced with clinic desk" : "Reconnecting to queue server..."}>
              <div
                className={cn(
                  "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                  wsConnected
                    ? "border-[#B5CDE8] bg-[#CFE0F3]/60 text-[#183D6D] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3]"
                    : "border-[#F4A62A]/40 bg-[#F4A62A]/15 text-[#9E5F00] animate-pulse"
                )}
              >
                {wsConnected ? (
                  <>
                    <span className="live-beacon relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#183D6D] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#183D6D] dark:bg-[#CFE0F3]" />
                    </span>
                    <Wifi className="h-3 w-3 text-[#183D6D] dark:text-[#CFE0F3]" />
                    <span className="hidden lg:inline text-[11px]">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-[#9E5F00]" />
                    <span className="text-[11px]">Reconnecting</span>
                  </>
                )}
              </div>
            </Tooltip>

            {/* Session Indicator (Saffron for Morning, Sky for Evening) */}
            <div className="hidden lg:flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  isMorning
                    ? "border-[#F4A62A]/40 bg-[#F4A62A]/15 text-[#9E5F00] dark:text-[#F4A62A]"
                    : "border-[#B5CDE8] bg-[#CFE0F3]/60 text-[#183D6D] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3]"
                )}
              >
                {isMorning ? (
                  <Sun className="h-3.5 w-3.5 text-[#F4A62A]" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-[#183D6D] dark:text-[#CFE0F3]" />
                )}
                <span>{isMorning ? t("session.morning") : t("session.evening")}</span>
              </span>

              {/* Doctor Availability Pill */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  doctorAvailable
                    ? "border-[#B5CDE8] bg-[#CFE0F3]/60 text-[#183D6D] dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3]"
                    : "border-[#F4A62A]/40 bg-[#F4A62A]/15 text-[#9E5F00] dark:text-[#F4A62A]"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    doctorAvailable ? "live-beacon bg-[#183D6D] dark:bg-[#CFE0F3]" : "bg-[#F4A62A]"
                  )}
                />
                <span className="hidden xl:inline">{doctorLabel}</span>
                <span className="xl:hidden">{compactDoctorLabel}</span>
              </span>
            </div>

            {/* Language Switcher Buttons (EN / GU / HI) */}
            <div
              className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-0.5"
              role="group"
              aria-label="Language selection"
            >
              {[
                { code: "en", label: "EN" },
                { code: "gu", label: "ગુ" },
                { code: "hi", label: "हि" },
              ].map(({ code, label }) => {
                const isSelected = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-w-[28px] sm:min-w-[32px] rounded-lg px-2 py-1 text-center text-xs font-bold transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#14213D] text-[#FBF7F0] dark:bg-[#FBF7F0] dark:text-[#14213D] shadow-xs"
                        : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Dark / Light Mode Switch */}
            <Tooltip side="bottom" content={isDark ? t("theme.light") : t("theme.dark")}>
              <button
                type="button"
                onClick={toggle}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-[#F4A62A]" />
                ) : (
                  <Moon className="h-4 w-4 text-[#14213D]" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}
