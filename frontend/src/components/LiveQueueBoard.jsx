import { useState } from "react";
import {
  Volume2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sun,
  Moon,
  Search,
  Stethoscope,
  ChevronRight,
  Check,
} from "lucide-react";
import { speakTokenAnnouncement, searchAppointment } from "../api";
import { useI18n } from "../context/I18nContext";
import {
  Badge,
  Button,
  Card,
  Input,
  ProgressBar,
  Skeleton,
  Stat,
  TokenNumber,
} from "./ui";

const EVENING_TIME_SLOTS = [
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
];

export default function LiveQueueBoard({
  statusData,
  settings,
  _wsConnected,
  onNavigateToBooking,
}) {
  const { t } = useI18n();
  const [quickSearch, setQuickSearch] = useState("");
  const [quickResult, setQuickResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [quickError, setQuickError] = useState(false);
  const [selectedEveningSlot, setSelectedEveningSlot] = useState("05:00 PM");

  const handleQuickSearch = async (e) => {
    e.preventDefault();
    const query = quickSearch.trim();
    if (!query) {
      setQuickError(true);
      return;
    }
    setSearching(true);
    setQuickError(false);
    try {
      const results = await searchAppointment(query);
      if (results && results.length > 0) {
        setQuickResult(results[0]);
      } else {
        setQuickResult("NOT_FOUND");
      }
    } catch (err) {
      console.error(err);
      setQuickResult("NOT_FOUND");
    } finally {
      setSearching(false);
    }
  };

  const morningBooked = statusData?.morning_booked || 0;
  const morningLimit = statusData?.morning_limit || 50;
  const morningRemaining = Math.max(0, morningLimit - morningBooked);
  const isMorningFull = Boolean(statusData?.morning_limit_reached) || morningRemaining === 0;

  const eveningBooked = statusData?.evening_booked || 0;
  const eveningLimit = statusData?.evening_limit || 50;
  const eveningRemaining = Math.max(0, eveningLimit - eveningBooked);
  const isEveningFull = eveningRemaining === 0;

  const totalWaiting = statusData?.total_waiting || 0;
  const totalCompleted = statusData?.total_completed || 0;
  const avgConsultTime = settings?.avg_consultation_time_minutes || 5;

  const morningPercent = Math.min(100, (morningBooked / morningLimit) * 100);
  const eveningPercent = Math.min(100, (eveningBooked / eveningLimit) * 100);

  const estimatedWaitMinutes = totalWaiting * avgConsultTime;

  if (!statusData) {
    return (
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* 50-Patient Morning Limit Alert Banner (Warm Saffron / Coral) */}
      {isMorningFull && (
        <Card className="border-[#F4A62A]/60 bg-[#F4A62A]/10 p-4 sm:p-5 dark:border-[#F4A62A]/30 dark:bg-[#F4A62A]/15 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4A62A] text-[#14213D] shadow-xs">
                <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-normal text-[#14213D] dark:text-[#FBF7F0]">
                    {t("live.morningFullTitle", { n: morningLimit })}
                  </h3>
                  <Badge tone="warning">{t("live.morningFullBadge")}</Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#5B6475] dark:text-[#CBD5E1] leading-relaxed">
                  {t("live.morningFullBody")}
                </p>
              </div>
            </div>
            <Button
              variant="evening"
              size="md"
              className="w-full shrink-0 sm:w-auto shadow-sm"
              onClick={() => onNavigateToBooking("EVENING")}
            >
              <span>{t("live.bookEvening")}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        </Card>
      )}

      {/* Main Hero Section: Dominant Now Serving Card + Search Widget */}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left 2 Cols: Editorial Hero Now Serving & Queue Preview */}
        <div className="space-y-6 xl:col-span-2">
          {/* Main Hero Card in Solid Warm Surface with Deep Ink Spotlight */}
          <Card className="overflow-hidden border border-[#EAE2D3] bg-white dark:bg-[#18243F] dark:border-[#263654] p-5 sm:p-7 shadow-[var(--shadow-card)]">
            {/* Header with Live indicator */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE2D3] dark:border-[#263654] pb-4">
              <div className="flex items-center gap-2.5">
                <Badge tone="live" pulse>
                  {t("common.live")}
                </Badge>
                <h2 className="font-display text-lg sm:text-xl font-normal text-[#14213D] dark:text-[#FBF7F0]">
                  {t("live.title")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusData?.active_session === "MORNING" ? "morning" : "evening"}>
                  {statusData?.active_session === "MORNING" ? (
                    <Sun className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Moon className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  <span>
                    {statusData?.active_session === "MORNING"
                      ? t("session.morning")
                      : t("session.evening")}
                  </span>
                </Badge>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#5B6475] dark:text-[#8E9BB0]">
                  <Stethoscope className="h-3.5 w-3.5 text-[#E4572E]" />
                  <span>{settings?.doctor_name || "Dr. Gitendra Patel"}</span>
                </span>
              </div>
            </div>

            {/* Cabin Center Spotlight: Asymmetric Split */}
            <div className="grid items-stretch gap-6 md:grid-cols-2">
              {/* Deep Ink #14213D Hero Spotlight Box */}
              <div className="hero-ink-panel relative flex flex-col items-center justify-between overflow-hidden rounded-2xl p-6 sm:p-8 text-center text-[#FBF7F0]">
                <div className="w-full flex items-center justify-between relative z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4572E] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    {t("live.inCabin")}
                  </span>
                  <span className="text-[11px] font-medium text-[#CFE0F3] tracking-wide">
                    Cabin 1 Consultation Room
                  </span>
                </div>

                <div className="my-6 relative z-10 w-full">
                  <span className="text-[11px] font-bold tracking-widest text-[#F4A62A] uppercase">
                    {t("live.nowServing")}
                  </span>
                  <div className="my-3 flex justify-center">
                    <TokenNumber
                      value={statusData?.current_serving_token}
                      showPulseRing
                      flashOnChange
                      className="text-6xl sm:text-7xl md:text-8xl font-normal text-[#E4572E] font-display"
                    />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-normal text-[#FBF7F0] truncate max-w-xs mx-auto">
                    {statusData?.current_serving_patient_name || t("live.waitingCall")}
                  </h3>
                  <p className="mt-1 text-xs text-[#CFE0F3]/80">
                    {settings?.doctor_name || "Dr. Gitendra Patel"} &bull; Surat
                  </p>
                </div>

                {/* Announcement Button */}
                <div className="relative z-10 w-full pt-2">
                  {statusData?.current_serving_token ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                      onClick={() =>
                        speakTokenAnnouncement(
                          statusData.current_serving_token,
                          statusData.current_serving_patient_name
                        )
                      }
                    >
                      <Volume2 className="h-4 w-4 text-[#F4A62A]" strokeWidth={2} />
                      <span>{t("live.hear")}</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-[#CFE0F3]/70 italic">
                      Doctor will call the next patient shortly
                    </span>
                  )}
                </div>
              </div>

              {/* Next in Line Preview Strip (Flat, solid, clean) */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#EAE2D3] dark:border-[#263654] bg-[#FBF7F0] dark:bg-[#131E35] p-5">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-[#EAE2D3] dark:border-[#263654] pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6475] dark:text-[#8E9BB0]">
                      {t("live.next")}
                    </span>
                    <span className="text-xs font-bold text-[#E4572E]">
                      {totalWaiting} in waiting area
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {statusData?.upcoming_tokens?.length > 0 ? (
                      statusData.upcoming_tokens.slice(0, 3).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between rounded-xl border border-[#EAE2D3] dark:border-[#263654] bg-white dark:bg-[#18243F] p-3 transition hover:border-[#14213D]/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CFE0F3]/60 font-mono text-xs font-bold text-[#183D6D]">
                              #{item.token_number}
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-bold text-[var(--fg)]">
                                {item.patient_name}
                              </span>
                              <span className="block text-[11px] text-[#5B6475] dark:text-[#8E9BB0]">
                                Token #{item.token_number}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-md bg-[#FBF7F0] dark:bg-[#131E35] px-2 py-0.5 text-[11px] font-semibold text-[#5B6475] border border-[#EAE2D3] dark:border-[#263654]">
                            ~{item.estimated_time}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-[#5B6475]">
                        <Users className="mx-auto h-7 w-7 text-[#5B6475]/40 mb-2" />
                        <p className="font-medium">{t("live.noneWaiting")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAE2D3] dark:border-[#263654] flex items-center justify-between text-xs text-[#5B6475] dark:text-[#8E9BB0]">
                  <span>Average consult: ~{avgConsultTime} min</span>
                  <button
                    type="button"
                    onClick={() => onNavigateToBooking()}
                    className="font-bold text-[#E4572E] hover:text-[#CC4820] cursor-pointer flex items-center gap-1"
                  >
                    <span>Book Token</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* 4 Real-time Stat Cards (Tactile Editorial Hierarchy) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <Stat
              icon={Users}
              label={t("live.waiting")}
              value={totalWaiting}
              hint={t("live.inQueue")}
              tone="saffron"
            />
            <Stat
              icon={CheckCircle2}
              label={t("live.completed")}
              value={totalCompleted}
              hint={t("live.consulted")}
              tone="coral"
            />
            <Stat
              icon={Clock}
              label={t("live.avg")}
              value={avgConsultTime}
              suffix={t("live.minutesShort")}
              hint={t("live.perPatient", { n: avgConsultTime })}
              tone="slate"
            />
            <Stat
              icon={Clock}
              label={t("live.estimatedWait")}
              value={estimatedWaitMinutes}
              suffix={t("live.minutesShort")}
              hint={t("live.allWaiting")}
              tone="sky"
            />
          </div>
        </div>

        {/* Right 1 Col: "What Is My Queue Number?" Quick Tracker Card in Deep Ink */}
        <div className="hero-ink-panel flex flex-col justify-between rounded-2xl p-6 sm:p-7 text-[#FBF7F0] relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4572E] text-white shadow-sm">
              <Search className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-normal tracking-tight text-[#FBF7F0]">
              {t("live.widgetTitle")}
            </h3>
            <p className="mt-1.5 text-xs text-[#CFE0F3]/90 leading-relaxed">
              Enter your mobile number or token to check your exact position and remaining wait time.
            </p>

            {/* Quick search input */}
            <form onSubmit={handleQuickSearch} className="mt-5 space-y-3">
              <div>
                <Input
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setQuickError(false);
                  }}
                  aria-invalid={quickError}
                  placeholder="e.g. 9876543210 or M-05"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-[#E4572E] focus:ring-[#E4572E]/30"
                />
                {quickError && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-[#FFA387]">
                    {t("track.required")}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                loading={searching}
                className="w-full bg-[#E4572E] hover:bg-[#CC4820] text-white font-bold shadow-sm"
              >
                {!searching && <Search className="h-4 w-4" strokeWidth={2} />}
                <span>{searching ? t("live.searching") : t("live.check")}</span>
              </Button>
            </form>

            {/* Result Box */}
            {quickResult && (
              <div className="mt-5 rounded-xl border border-white/20 bg-white/10 p-4 text-xs">
                {quickResult === "NOT_FOUND" ? (
                  <div className="py-2 text-center">
                    <p className="font-semibold text-[#FFA387]">{t("live.notFound")}</p>
                    <p className="mt-1 text-[11px] text-[#CFE0F3]/80">
                      Check your mobile number or token format (e.g. M-01, E-05)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[#CFE0F3] font-medium">{t("live.token")}</span>
                      <strong className="text-xl font-display text-[#E4572E]">
                        #{quickResult.appointment.token_number}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#CFE0F3]">{t("live.patient")}</span>
                      <strong className="text-white">
                        {quickResult.appointment.patient_name}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#CFE0F3]">{t("live.ahead")}</span>
                      <strong className="text-[#F4A62A]">
                        {quickResult.patients_ahead === 0
                          ? "You are next in line!"
                          : `${quickResult.patients_ahead} patients ahead`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-[#CFE0F3]">{t("live.est")}</span>
                      <strong className="text-white">
                        About {quickResult.estimated_wait_minutes} minutes
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clinic Help Note */}
          <div className="mt-6 border-t border-white/15 pt-4 text-[11px] text-[#CFE0F3]/80 leading-relaxed">
            <p className="font-medium">
              Gurukrupa Clinic &bull; Station Road, Surat &bull; Walk-in patients also accommodated.
            </p>
          </div>
        </div>
      </div>

      {/* Session Cards (Morning in Saffron, Evening in Sky) */}
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
        {/* Morning Session Card (Warm Saffron Accent) */}
        <Card
          hover
          className={`p-5 sm:p-7 border border-[#EAE2D3] dark:border-[#263654] ${
            isMorningFull
              ? "border-[#F4A62A]/50 bg-[#F4A62A]/5 dark:bg-[#F4A62A]/10"
              : ""
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4A62A]/20 text-[#B87104] dark:text-[#F4A62A]">
                <Sun className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-normal text-[var(--fg)]">
                    {t("common.morning")}
                  </h3>
                  <Badge
                    tone={
                      isMorningFull
                        ? "danger"
                        : morningRemaining <= 10
                          ? "warning"
                          : "morning"
                    }
                  >
                    {isMorningFull
                      ? t("live.fullStatus")
                      : morningRemaining <= 10
                        ? t("live.fillingFast")
                        : t("live.slotsAvailable")}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5B6475] dark:text-[#8E9BB0]">
                  <Clock className="h-3.5 w-3.5 text-[#F4A62A]" strokeWidth={1.8} />
                  <span>
                    {settings?.morning_start_time || "09:00 AM"} –{" "}
                    {settings?.morning_end_time || "01:00 PM"}
                  </span>
                </p>
              </div>
            </div>

            {/* Circular Ring Gauge */}
            <RingMeter value={morningPercent} color="#F4A62A" />
          </div>

          {/* Quota Progress */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between gap-2 text-xs font-semibold">
              <span className="text-[var(--fg)]">
                {t("live.booked", { a: morningBooked, b: morningLimit })}
              </span>
              <span className={isMorningFull ? "text-[#E4572E] font-bold" : "text-[#B87104] dark:text-[#F4A62A]"}>
                {isMorningFull
                  ? t("live.capacityReached")
                  : t("live.slotsLeft", { n: morningRemaining })}
              </span>
            </div>
            <ProgressBar value={morningPercent} tone={isMorningFull ? "danger" : "morning"} />
          </div>

          {/* Footer & Action */}
          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-[#EAE2D3] dark:border-[#263654] pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-[#5B6475] dark:text-[#8E9BB0]">
              {isMorningFull
                ? t("live.token51")
                : t("live.nextToken", {
                    token: `M-${(morningBooked + 1).toString().padStart(2, "0")}`,
                  })}
            </p>
            <Button
              variant={isMorningFull ? "evening" : "morning"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onNavigateToBooking(isMorningFull ? "EVENING" : "MORNING")}
            >
              <span>{isMorningFull ? t("live.bookEvening") : t("live.bookMorning")}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </div>
        </Card>

        {/* Evening Session Card with Interactive Slot Chips (Soft Sky Accent) */}
        <Card hover className="p-5 sm:p-7 border border-[#EAE2D3] dark:border-[#263654]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0F3] text-[#183D6D]">
                <Moon className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-normal text-[var(--fg)]">
                    {t("common.evening")}
                  </h3>
                  <Badge
                    tone={
                      isEveningFull
                        ? "danger"
                        : eveningRemaining <= 10
                          ? "warning"
                          : "evening"
                    }
                  >
                    {isEveningFull
                      ? t("live.fullStatus")
                      : eveningRemaining <= 10
                        ? t("live.fillingFast")
                        : t("live.slotsLeft", { n: eveningRemaining })}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5B6475] dark:text-[#8E9BB0]">
                  <Clock className="h-3.5 w-3.5 text-[#183D6D]" strokeWidth={1.8} />
                  <span>
                    {settings?.evening_start_time || "04:30 PM"} –{" "}
                    {settings?.evening_end_time || "08:30 PM"}
                  </span>
                </p>
              </div>
            </div>

            {/* Circular Ring Gauge */}
            <RingMeter value={eveningPercent} color="#7DA2CC" />
          </div>

          {/* Evening Slot Selection Chips */}
          <div className="mt-5">
            <span className="mb-2 block text-[11px] font-bold tracking-wider text-[#5B6475] dark:text-[#8E9BB0] uppercase">
              {t("live.eveningSlots")}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EVENING_TIME_SLOTS.map((slot) => {
                const isSelected = selectedEveningSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedEveningSlot(slot)}
                    aria-pressed={isSelected}
                    className={`min-h-[40px] rounded-xl border px-2.5 py-1.5 text-center text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
                      isSelected
                        ? "border-[#14213D] bg-[#14213D] text-[#FBF7F0] shadow-sm"
                        : "border-[#EAE2D3] bg-[#FBF7F0] dark:bg-[#131E35] dark:border-[#263654] text-[var(--fg)] hover:border-[#14213D]/40"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
                    <span>{slot}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between gap-2 text-xs font-semibold">
              <span className="text-[var(--fg)]">
                {t("live.booked", { a: eveningBooked, b: eveningLimit })}
              </span>
              <span className={isEveningFull ? "text-[#E4572E] font-bold" : "text-[#183D6D] dark:text-[#CFE0F3]"}>
                {isEveningFull
                  ? t("live.capacityReached")
                  : t("live.slotsLeft", { n: eveningRemaining })}
              </span>
            </div>
            <ProgressBar value={eveningPercent} tone="evening" />
          </div>

          {/* Footer & Action */}
          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-[#EAE2D3] dark:border-[#263654] pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-[#5B6475] dark:text-[#8E9BB0]">
              {t("live.eveningHint")}
            </p>
            <Button
              variant="evening"
              size="sm"
              disabled={isEveningFull}
              className="w-full sm:w-auto"
              onClick={() => onNavigateToBooking("EVENING", selectedEveningSlot)}
            >
              <span>{t("live.bookEveningSlot")}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Circular progress meter with SVG ring in Warm Care tones
function RingMeter({ value, color }) {
  const percent = Math.min(100, Math.max(0, value));
  const strokeWidth = 5;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center"
      role="img"
      aria-label={`${Math.round(percent)} percent of session capacity booked`}
    >
      <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#EAE2D3] dark:text-[#263654]"
          fill="none"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-[var(--fg)] font-mono">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
