import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  AlertCircle,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  CheckCircle2,
} from "lucide-react";
import { playChime, searchAppointment } from "../api";
import { useI18n } from "../context/I18nContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "./PageHeader";
import { Badge, Button, Card, EmptyState, Input, Switch, Timeline, TokenNumber } from "./ui";

export default function MyTokenTracker({ initialQuery = "", statusData }) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  const notifiedAppointments = useRef(new Set());
  const queryRef = useRef(query);
  const soundEnabledRef = useRef(soundEnabled);
  const lastSearchRef = useRef("");
  const lastQueueStatusRef = useRef({
    token: statusData?.current_serving_token,
    waiting: statusData?.total_waiting,
  });

  const doSearch = useCallback(
    async (val) => {
      const q = (val ?? queryRef.current).trim();
      if (!q) return;
      lastSearchRef.current = q;
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchAppointment(q);
        setResults(res);
        if (
          res.length > 0 &&
          res[0].patients_ahead <= 2 &&
          res[0].patients_ahead >= 0 &&
          soundEnabledRef.current
        ) {
          playChime();
        }
      } catch (err) {
        console.error("Tracking search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialQuery.trim()) {
      void doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  // Live WebSocket auto-refresh when queue changes
  useEffect(() => {
    const queueStatus = {
      token: statusData?.current_serving_token,
      waiting: statusData?.total_waiting,
    };
    const previous = lastQueueStatusRef.current;
    lastQueueStatusRef.current = queueStatus;
    if (
      previous.token === queueStatus.token &&
      previous.waiting === queueStatus.waiting
    ) {
      return;
    }
    if (lastSearchRef.current) {
      void doSearch(lastSearchRef.current);
    }
  }, [statusData?.current_serving_token, statusData?.total_waiting, doSearch]);

  // Browser desktop notification when patient is ≤ 2 tokens away
  useEffect(() => {
    if (!notificationEnabled || typeof Notification === "undefined") return;
    const item = results.find(
      (result) =>
        result.appointment.status === "WAITING" && result.patients_ahead <= 2
    );
    if (!item || notifiedAppointments.current.has(item.appointment.id)) return;
    notifiedAppointments.current.add(item.appointment.id);
    new Notification("Gurukrupa Clinic · Token Alert", {
      body: `Token #${item.appointment.token_number} is nearly next! ~${item.estimated_wait_minutes} min remaining. Please be near Cabin 1.`,
      icon: "/clinic-icon-192.png",
    });
  }, [results, notificationEnabled]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast(t("track.notifyUnavailable"), "error");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationEnabled(permission === "granted");
    toast(
      permission === "granted" ? t("track.notifyEnabled") : t("track.notifyDenied"),
      permission === "granted" ? "success" : "error"
    );
  };

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t("track.title")}
        subtitle={t("track.subtitle")}
        current={t("nav.track")}
      />

      {/* Search Input Box */}
      <Card className="p-5 sm:p-7 shadow-[var(--shadow-card)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doSearch();
          }}
          className="flex flex-col gap-3 sm:flex-row items-center"
        >
          <div className="flex-1 w-full">
            <Input
              icon={Search}
              value={query}
              onChange={(e) => {
                queryRef.current = e.target.value;
                setQuery(e.target.value);
              }}
              placeholder={t("track.placeholder")}
              className="min-h-[50px] text-sm sm:text-base font-medium shadow-2xs"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full sm:w-auto shrink-0 shadow-sm"
          >
            {!loading && <Search className="h-4 w-4" strokeWidth={2} />}
            <span>{t("track.search")}</span>
          </Button>
        </form>

        {/* Alerts & Sound Settings Bar */}
        <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--fg-muted)] sm:flex-row sm:items-center">
          <span className="italic">{t("track.tip")}</span>
          <div className="flex flex-wrap items-center gap-4">
            <Switch
              checked={soundEnabled}
              onChange={(nextValue) => {
                soundEnabledRef.current = nextValue;
                setSoundEnabled(nextValue);
              }}
              label={
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--fg)]">
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-[#E4572E]" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span>{soundEnabled ? t("track.soundOn") : t("track.soundOff")}</span>
                </span>
              }
            />

            {typeof Notification !== "undefined" && (
              <button
                type="button"
                onClick={enableNotifications}
                disabled={notificationEnabled}
                className="inline-flex items-center gap-1.5 font-semibold text-[#E4572E] hover:underline disabled:text-[var(--fg-muted)] disabled:no-underline cursor-pointer"
              >
                {notificationEnabled ? (
                  <BellRing className="h-3.5 w-3.5 text-[#E4572E]" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                <span>
                  {notificationEnabled ? t("track.notifyEnabled") : t("track.notify")}
                </span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Results View */}
      {hasSearched && (
        <div className="space-y-6">
          {results.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title={t("track.emptyTitle")}
              body={t("track.emptyBody")}
              action={
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      queryRef.current = "";
                      setHasSearched(false);
                    }}
                  >
                    Clear Search
                  </Button>
                </div>
              }
            />
          ) : (
            results.map((item) => {
              const appt = item.appointment;
              const isWaiting = appt.status === "WAITING";
              const isCalled = appt.status === "CALLED" || appt.status === "IN_PROGRESS";
              const isCompleted = appt.status === "COMPLETED";
              const step = isCompleted
                ? 4
                : isCalled
                  ? 3
                  : isWaiting
                    ? item.patients_ahead <= 2
                      ? 2
                      : 1
                    : 0;

              return (
                <Card
                  key={appt.id}
                  className={`overflow-hidden border transition-all ${
                    isCalled
                      ? "border-[#E4572E] ring-2 ring-[#E4572E]/30 shadow-[var(--shadow-coral)]"
                      : "border-[#EAE2D3] dark:border-[#263654]"
                  }`}
                >
                  {/* Status Ribbon Header */}
                  <div
                    className={`flex items-center justify-between px-5 py-3 text-xs font-bold ${
                      isCalled
                        ? "bg-[#E4572E] text-white shadow-xs"
                        : isWaiting
                          ? "border-b border-[#F4A62A]/30 bg-[#F4A62A]/15 text-[#9E5F00] dark:text-[#F4A62A]"
                          : isCompleted
                            ? "bg-[var(--surface-2)] text-[var(--fg-muted)]"
                            : "bg-[#E4572E]/10 text-[#C93B12]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCalled && <span className="live-beacon h-2 w-2 rounded-full bg-white" />}
                      <span>
                        {isCalled
                          ? t("track.called")
                          : isWaiting
                            ? t("track.waiting")
                            : isCompleted
                              ? t("track.done")
                              : t("track.skipped")}
                      </span>
                    </div>
                    <span>
                      {appt.session === "MORNING"
                        ? t("session.morning")
                        : t("session.evening")}{" "}
                      Session
                    </span>
                  </div>

                  <div className="space-y-6 p-5 sm:p-8">
                    {/* Top Row: Token & Wait Info */}
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                      <div>
                        <span className="text-[11px] font-bold tracking-widest text-[#5B6475] uppercase">
                          {t("track.allocated")}
                        </span>
                        <div className="mt-1 flex items-baseline gap-2">
                          <TokenNumber
                            value={appt.token_number}
                            showPulseRing={isCalled}
                            flashOnChange
                            className="font-display text-5xl sm:text-6xl font-normal text-[#E4572E]"
                          />
                        </div>
                        <h4 className="mt-2 text-xl font-display text-[var(--fg)]">
                          {appt.patient_name}
                        </h4>
                        <p className="text-xs text-[#5B6475] dark:text-[#8E9BB0] mt-0.5">
                          {appt.age} {t("common.years")} • {appt.gender} • {appt.city || "Surat"}
                        </p>
                      </div>

                      {/* Wait Cards */}
                      {isWaiting && (
                        <Card className="w-full sm:w-auto sm:min-w-[210px] border-[#F4A62A]/40 bg-[#F4A62A]/10 p-5 text-center shadow-xs">
                          <span className="text-[11px] font-bold text-[#9E5F00] dark:text-[#F4A62A] uppercase tracking-wider block">
                            {t("track.ahead")}
                          </span>
                          <div className="font-display my-1 text-3xl sm:text-4xl font-normal text-[#B87104] dark:text-[#F4A62A]">
                            {t("track.patients", { n: item.patients_ahead })}
                          </div>
                          <span className="text-xs font-semibold text-[#5B6475] dark:text-[#8E9BB0]">
                            About {item.estimated_wait_minutes} minutes to go
                          </span>
                        </Card>
                      )}

                      {isCalled && (
                        <div className="w-full sm:w-auto sm:min-w-[220px] rounded-xl bg-[#E4572E] p-5 text-center text-white shadow-md animate-pulse">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 block">
                            {t("track.yourTurn")}
                          </span>
                          <div className="mt-1 text-2xl font-display font-normal">
                            {t("track.proceed")}
                          </div>
                          <span className="mt-1 block text-xs text-white/90">
                            Consultation Cabin 1
                          </span>
                        </div>
                      )}

                      {isCompleted && (
                        <Card className="w-full sm:w-auto sm:min-w-[200px] bg-[#FBF7F0] p-5 text-center dark:bg-[#131E35] border border-[#EAE2D3] dark:border-[#263654]">
                          <CheckCircle2 className="mx-auto h-7 w-7 text-[#183D6D] dark:text-[#CFE0F3] mb-1" />
                          <span className="text-xs font-bold uppercase text-[var(--fg-muted)] block">
                            Consultation
                          </span>
                          <div className="text-base font-bold text-[var(--fg)] mt-0.5">
                            Completed
                          </div>
                        </Card>
                      )}
                    </div>

                    {/* Visual 5-Step Queue Timeline */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-6">
                      <Timeline
                        current={step}
                        steps={[
                          { label: t("track.booked"), hint: t("track.confirmed") },
                          {
                            label: t("track.inQueue"),
                            hint: isWaiting
                              ? t("track.patients", { n: item.patients_ahead })
                              : t("track.passed"),
                          },
                          {
                            label: t("track.nextUp"),
                            hint: step === 2 ? t("track.almostNext") : "—",
                          },
                          {
                            label: t("track.inCabin"),
                            hint: isCalled ? t("track.active") : "—",
                          },
                          {
                            label: t("track.completed"),
                            hint: isCompleted ? t("track.finished") : "—",
                          },
                        ]}
                      />
                    </div>

                    {/* Metadata summary footer */}
                    <div className="flex flex-col justify-between gap-3 rounded-2xl bg-[var(--surface-2)] p-4 text-xs sm:flex-row sm:items-center">
                      <div>
                        {t("track.slot")}:{" "}
                        <strong className="text-[var(--fg)]">{appt.time_slot}</strong>
                      </div>
                      <div>
                        {t("track.serving")}:{" "}
                        <Badge tone="live" pulse>
                          <span className="token-num font-mono">
                            #{statusData?.current_serving_token || "--"}
                          </span>
                        </Badge>
                      </div>
                      <div>
                        {t("track.date")}:{" "}
                        <span className="font-semibold text-[var(--fg)]">
                          {appt.appointment_date}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
