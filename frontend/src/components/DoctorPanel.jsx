import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Volume2,
  Settings as SettingsIcon,
  Sun,
  Moon,
  RotateCcw,
  UserPlus,
  CircleCheck,
  Coffee,
  CircleOff,
  Stethoscope,
  SkipForward,
  Search,
  LayoutDashboard,
  BarChart3,
  Clock,
  Check,
  Ticket,
} from "lucide-react";
import {
  fetchTodayAppointments,
  doctorCallNext,
  doctorRecall,
  doctorComplete,
  doctorSkip,
  updateDoctorStatus,
  switchSession,
  updateSettings,
  speakTokenAnnouncement,
  bookAppointment,
} from "../api";
import { useToast } from "../context/ToastContext";
import { useI18n } from "../context/I18nContext";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
} from "./ui";

export default function DoctorPanel({
  statusData,
  settings,
  onRefreshStatus,
}) {
  const { toast } = useToast();
  const { t } = useI18n();

  // Navigation tabs within Doctor Desk
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "walkin" | "analytics" | "settings"

  const [appointments, setAppointments] = useState([]);
  const [filterSession, setFilterSession] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [notesModal, setNotesModal] = useState({
    open: false,
    apptId: null,
    patientName: "",
    notes: "",
  });
  const [skipConfirmModal, setSkipConfirmModal] = useState({
    open: false,
    apptId: null,
    patientName: "",
    tokenNumber: "",
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);

  // Settings form state
  const [editSettings, setEditSettings] = useState({
    morning_patient_limit: 50,
    evening_patient_limit: 50,
    morning_start_time: "09:00 AM",
    morning_end_time: "01:00 PM",
    evening_start_time: "04:30 PM",
    evening_end_time: "08:30 PM",
    avg_consultation_time_minutes: 5,
    doctor_name: "",
    clinic_name: "",
  });

  // Walk-in form state
  const [walkinData, setWalkinData] = useState({
    patient_name: "",
    phone_number: "",
    age: "",
    gender: "Male",
    city: "Surat",
    reason: "General Consultation (Walk-in)",
    session: statusData?.active_session || "MORNING",
  });
  const [walkinErrors, setWalkinErrors] = useState({});

  const loadTodayAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTodayAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      toast("Could not refresh appointments list.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void loadTodayAppointments();
  }, [loadTodayAppointments, statusData?.current_serving_token]);

  useEffect(() => {
    if (!settings) return;
    // eslint-disable-next-line react/set-state-in-effect
    setEditSettings({
      morning_patient_limit: settings.morning_patient_limit || 50,
      evening_patient_limit: settings.evening_patient_limit || 50,
      morning_start_time: settings.morning_start_time || "09:00 AM",
      morning_end_time: settings.morning_end_time || "01:00 PM",
      evening_start_time: settings.evening_start_time || "04:30 PM",
      evening_end_time: settings.evening_end_time || "08:30 PM",
      avg_consultation_time_minutes: settings.avg_consultation_time_minutes || 5,
      doctor_name: settings.doctor_name || "",
      clinic_name: settings.clinic_name || "",
    });
  }, [settings]);

  // Primary Actions
  const handleCallNext = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await doctorCallNext();
      if (res.called) {
        speakTokenAnnouncement(res.called.token_number, res.called.patient_name);
        toast(`Calling Token #${res.called.token_number} (${res.called.patient_name})`, "success");
      } else {
        toast(res.message || "No more waiting patients in queue.", "warning");
      }
      loadTodayAppointments();
      onRefreshStatus?.();
    } catch (err) {
      console.error(err);
      toast("Could not call the next patient.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [loadTodayAppointments, onRefreshStatus, toast]);

  const handleRecall = useCallback(async () => {
    try {
      const res = await doctorRecall();
      if (res.recalled) {
        speakTokenAnnouncement(res.recalled.token_number, res.recalled.patient_name);
        toast(`Re-announced Token #${res.recalled.token_number}`, "success");
      } else {
        toast("No patient is currently in cabin to recall.", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Could not recall patient.", "error");
    }
  }, [toast]);

  const handleCompleteCurrent = useCallback(() => {
    if (!statusData?.current_serving_id) {
      toast("No patient is currently in the cabin.", "error");
      return;
    }
    setNotesModal({
      open: true,
      apptId: statusData.current_serving_id,
      patientName: statusData.current_serving_patient_name || "",
      notes: "",
    });
  }, [statusData, toast]);

  const submitCompleteWithNotes = async () => {
    try {
      await doctorComplete(notesModal.apptId, notesModal.notes);
      toast("Consultation marked completed.", "success");
      setNotesModal({ open: false, apptId: null, patientName: "", notes: "" });
      loadTodayAppointments();
      onRefreshStatus?.();
    } catch (err) {
      console.error(err);
      toast("Could not complete consultation.", "error");
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipConfirmModal.apptId) return;
    try {
      await doctorSkip(skipConfirmModal.apptId);
      toast(`Token #${skipConfirmModal.tokenNumber} marked absent/skipped.`, "warning");
      setSkipConfirmModal({ open: false, apptId: null, patientName: "", tokenNumber: "" });
      loadTodayAppointments();
      onRefreshStatus?.();
    } catch (err) {
      console.error(err);
      toast("Could not skip this patient.", "error");
    }
  };

  // Keyboard Shortcuts: N for Next, R for Recall, C for Complete
  useEffect(() => {
    const onShortcut = (event) => {
      const target = event.target;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName)
      ) {
        return;
      }
      if (event.key.toLowerCase() === "n" && !actionLoading) {
        event.preventDefault();
        handleCallNext();
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        handleRecall();
      }
      if (event.key.toLowerCase() === "c" && statusData?.current_serving_id) {
        event.preventDefault();
        handleCompleteCurrent();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [actionLoading, handleCallNext, handleRecall, handleCompleteCurrent, statusData?.current_serving_id]);

  const handleStatusChange = async (st) => {
    try {
      await updateDoctorStatus(st);
      toast(`Doctor availability set to ${st.replace(/_/g, " ")}.`, "success");
      onRefreshStatus?.();
    } catch (err) {
      console.error(err);
      toast("Could not update doctor availability.", "error");
    }
  };

  const handleSessionChange = async (ses) => {
    try {
      await switchSession(ses);
      toast(`Active session switched to ${ses}.`, "success");
      onRefreshStatus?.();
    } catch (err) {
      console.error(err);
      toast("Could not switch active session.", "error");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(editSettings);
      setShowSettingsModal(false);
      onRefreshStatus?.();
      toast("Clinic timings and quotas updated.", "success");
    } catch (err) {
      console.error(err);
      toast("Error saving settings.", "error");
    }
  };

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!walkinData.patient_name.trim()) errors.name = "Patient name is required.";
    const cleanPhone = walkinData.phone_number.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) errors.phone = "10-digit phone required.";
    if (!walkinData.age || Number(walkinData.age) < 1) errors.age = "Valid age required.";

    if (Object.keys(errors).length > 0) {
      setWalkinErrors(errors);
      return;
    }
    setWalkinErrors({});

    try {
      const payload = {
        patient_name: walkinData.patient_name.trim(),
        phone_number: cleanPhone,
        age: parseInt(walkinData.age, 10),
        gender: walkinData.gender,
        city: walkinData.city.trim() || "Surat",
        reason: walkinData.reason.trim(),
        session: walkinData.session,
      };
      const res = await bookAppointment(payload);
      setShowWalkinModal(false);
      setWalkinData({
        patient_name: "",
        phone_number: "",
        age: "",
        gender: "Male",
        city: "Surat",
        reason: "General Consultation (Walk-in)",
        session: statusData?.active_session || "MORNING",
      });
      loadTodayAppointments();
      onRefreshStatus?.();
      toast(`Walk-in Token #${res.token_number} generated!`, "success");
    } catch (err) {
      console.error(err);
      toast(err.detail?.message || "Failed to create walk-in appointment.", "error");
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filterSession !== "ALL" && a.session !== filterSession) return false;
      if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
      const q = searchQuery.trim().toLowerCase();
      if (
        q &&
        ![a.patient_name, a.phone_number, a.token_number, a.city]
          .some((val) => String(val || "").toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [appointments, filterSession, filterStatus, searchQuery]);

  // Simulated hourly analytics data for the clinic chart
  const hourlyConsultationData = useMemo(() => {
    const hours = [
      { slot: "09 AM", count: 8, completed: 8 },
      { slot: "10 AM", count: 12, completed: 11 },
      { slot: "11 AM", count: 14, completed: 13 },
      { slot: "12 PM", count: 10, completed: 9 },
      { slot: "05 PM", count: 6, completed: 6 },
      { slot: "06 PM", count: 11, completed: 8 },
      { slot: "07 PM", count: 9, completed: 4 },
      { slot: "08 PM", count: 5, completed: 1 },
    ];
    return hours;
  }, []);

  const totalWaiting = statusData?.total_waiting || 0;
  const totalCompleted = statusData?.total_completed || 0;

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)]/85 backdrop-blur-xl p-4 sm:p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#14213D] text-[#FBF7F0] shadow-sm">
            <Stethoscope className="h-6 w-6 text-[#E4572E]" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--fg)] tracking-tight">
                {t("desk.title")}
              </h2>
              <Badge tone="live" pulse>
                {t("desk.live")}
              </Badge>
            </div>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {settings?.doctor_name || "Dr. Gitendra Patel"} &bull; Cabin 1 &bull; {settings?.clinic_name || "Gurukrupa Clinic"}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 sm:flex-initial"
            onClick={() => setShowWalkinModal(true)}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2} />
            <span>+ {t("desk.walkin")}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-initial"
            onClick={() => setShowSettingsModal(true)}
          >
            <SettingsIcon className="h-4 w-4 text-[var(--fg-muted)]" strokeWidth={2} />
            <span>{t("desk.settings")}</span>
          </Button>

          <button
            type="button"
            onClick={loadTodayAppointments}
            className="rounded-xl border border-[var(--border)] p-2.5 text-[var(--fg-muted)] hover:bg-[var(--surface-2)] transition cursor-pointer"
            title="Refresh List"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Layout: Collapsible Sidebar + Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar (1 Col on Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 sm:p-5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] block px-1">
              Console Views
            </span>

            <nav className="space-y-1">
              {[
                { id: "queue", label: "Queue Workspace", icon: LayoutDashboard, count: totalWaiting },
                { id: "walkin", label: "Walk-in Counter", icon: UserPlus },
                { id: "analytics", label: "Hourly Analytics", icon: BarChart3 },
                { id: "settings", label: "Clinic Timings", icon: Clock },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === "walkin") setShowWalkinModal(true);
                      else if (item.id === "settings") setShowSettingsModal(true);
                      else setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-[#14213D] text-[#FBF7F0] dark:bg-[#FBF7F0] dark:text-[#14213D] shadow-xs"
                        : "text-[var(--fg-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-[var(--surface-2)] text-[var(--fg-muted)]"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Doctor Presence Availability Selector */}
            <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] block px-1">
                Doctor Availability
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "AVAILABLE", label: "Available", icon: CircleCheck, color: "text-[#183D6D]" },
                  { id: "IN_CONSULTATION", label: "Consulting", icon: Stethoscope, color: "text-[#E4572E]" },
                  { id: "ON_BREAK", label: "On Break", icon: Coffee, color: "text-[#F4A62A]" },
                  { id: "OFF_DUTY", label: "Off Duty", icon: CircleOff, color: "text-slate-500" },
                ].map((s) => {
                  const isCurrent = statusData?.doctor_status === s.id;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStatusChange(s.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? "border-[#B5CDE8] bg-[#CFE0F3]/60 text-[#183D6D] font-bold dark:bg-[#CFE0F3]/20 dark:text-[#CFE0F3]"
                          : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? "text-[#183D6D] dark:text-[#CFE0F3]" : ""}`} />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Switcher in Sidebar */}
            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] block px-1">
                Active Session
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSessionChange("MORNING")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
                    statusData?.active_session === "MORNING"
                      ? "border-amber-500 bg-amber-500 text-slate-950 shadow-xs"
                      : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Morning</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSessionChange("EVENING")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
                    statusData?.active_session === "EVENING"
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Evening</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Today's Quota Quick Summary Card */}
          <Card className="p-4 sm:p-5 space-y-3 bg-[var(--surface-1)] border border-[var(--border)]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--fg)] block">
              Today's Session Quotas
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-[var(--fg-muted)]">Morning Bookings:</span>
                <span className="font-bold text-[var(--fg)] font-mono">
                  {statusData?.morning_booked || 0} / {statusData?.morning_limit || 50}
                  {statusData?.morning_full && (
                    <span className="ml-1 text-[10px] text-rose-600 font-extrabold">(FULL)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-[var(--fg-muted)]">Evening Bookings:</span>
                <span className="font-bold text-[var(--fg)] font-mono">
                  {statusData?.evening_booked || 0} / {statusData?.evening_limit || 50}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[var(--fg-muted)]">Completed Consultations:</span>
                <span className="font-bold text-[#E4572E] font-mono">
                  {totalCompleted} Patients
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Work Area (3 Cols on Desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero Consultation Calling Console */}
          <Card className="overflow-hidden border border-[var(--border)] p-5 sm:p-7 bg-[var(--surface-1)] shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left side: Now In Cabin Hero */}
              <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white flex flex-col justify-between shadow-lg bg-[#14213D] border border-[#263654]">
                <div className="flex items-center justify-between">
                  <Badge tone="live" pulse>
                    {t("desk.inCabin")}
                  </Badge>
                  <span className="text-xs text-[#CFE0F3] font-mono">
                    Cabin 1
                  </span>
                </div>

                <div className="my-4 text-center">
                  <span className="text-[11px] font-bold tracking-widest text-[#F4A62A] uppercase">
                    Currently Consulting
                  </span>
                  <div className="token-num my-2 text-5xl sm:text-6xl font-black text-[#E4572E] font-display drop-shadow-sm">
                    {statusData?.current_serving_token ? `#${statusData.current_serving_token}` : t("desk.none")}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white truncate">
                    {statusData?.current_serving_patient_name || t("desk.callHint")}
                  </h4>
                </div>

                {/* Big Call Next Button with 'N' shortcut */}
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleCallNext}
                    disabled={actionLoading}
                    className="w-full bg-[#E4572E] hover:bg-[#CC4820] text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Volume2 className="h-4 w-4" strokeWidth={2.4} />
                    <span>{t("desk.callNext")}</span>
                    <kbd className="ml-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono border border-white/20">
                      N
                    </kbd>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleRecall}
                      disabled={!statusData?.current_serving_token}
                      className="rounded-lg bg-white/10 hover:bg-white/20 py-2 text-center text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer"
                      title="Announce token again on speaker"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{t("desk.recall")}</span>
                        <kbd className="rounded border border-white/20 px-1 text-[9px]">R</kbd>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteCurrent}
                      disabled={!statusData?.current_serving_token}
                      className="rounded-lg bg-[#183D6D] hover:bg-[#122E52] py-2 text-center text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1">
                        <CircleCheck className="h-3.5 w-3.5" />
                        <span>{t("desk.complete")}</span>
                        <kbd className="rounded border border-white/20 px-1 text-[9px]">C</kbd>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!statusData?.current_serving_id) return;
                        setSkipConfirmModal({
                          open: true,
                          apptId: statusData.current_serving_id,
                          patientName: statusData.current_serving_patient_name || "",
                          tokenNumber: statusData.current_serving_token || "",
                        });
                      }}
                      disabled={!statusData?.current_serving_token}
                      className="rounded-lg bg-rose-600/80 hover:bg-rose-600 py-2 text-center text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1">
                        <SkipForward className="h-3.5 w-3.5" />
                        <span>{t("desk.skip")}</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right side: Next Patients in Queue Preview & Quick Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--fg-muted)]">
                    Next In Waiting Line
                  </span>
                  <Badge tone="warning">
                    {totalWaiting} Waiting
                  </Badge>
                </div>

                <div className="space-y-2">
                  {statusData?.upcoming_tokens && statusData.upcoming_tokens.length > 0 ? (
                    statusData.upcoming_tokens.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#CFE0F3]/30 font-mono font-bold text-[#14213D] dark:text-[#CFE0F3]">
                            #{item.token_number}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--fg)] block truncate max-w-[130px]">
                              {item.patient_name}
                            </span>
                            <span className="text-[11px] text-[var(--fg-muted)]">
                              ~{item.estimated_time}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 py-1 px-2.5 text-[11px]"
                          onClick={async () => {
                            await doctorCallNext();
                            speakTokenAnnouncement(item.token_number, item.patient_name);
                            loadTodayAppointments();
                            onRefreshStatus?.();
                          }}
                        >
                          <Volume2 className="h-3.5 w-3.5 text-[#E4572E]" />
                          <span>Call</span>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[var(--fg-muted)]">
                      <Users className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                      No patients currently waiting.
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs flex items-center justify-between text-[var(--fg-muted)]">
                  <span>Estimated total wait: ~{totalWaiting * 5} min</span>
                  <span className="font-bold text-[var(--fg)]">Speed: ~5 min/patient</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Hourly Consultation Analytics Chart (Tab: Analytics) */}
          {activeTab === "analytics" && (
            <Card className="p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                    Today's Hourly Consultation Volume
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Patients consulted per hour across Morning and Evening sessions.
                  </p>
                </div>
                <Badge tone="neutral">
                  {totalCompleted} Completed
                </Badge>
              </div>

              {/* Bar Chart Visualization */}
              <div className="pt-4">
                <div className="grid grid-cols-8 gap-2 items-end h-48 border-b border-[var(--border)] pb-2">
                  {hourlyConsultationData.map((slot) => {
                    const heightPercent = Math.min(100, (slot.count / 15) * 100);
                    return (
                      <div key={slot.slot} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-[var(--fg-muted)]">
                          {slot.count}
                        </span>
                        <div
                          className="w-full max-w-[36px] rounded-t-lg bg-[#E4572E] transition-all duration-500 shadow-2xs hover:brightness-110"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[11px] font-bold text-[var(--fg)] truncate">
                          {slot.slot}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Today's Live Queue Table & Filter Toolbar (Tab: Queue) */}
          {activeTab === "queue" && (
            <Card className="p-5 sm:p-7 space-y-4">
              {/* Header and Filters Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[var(--fg)] text-base sm:text-lg">
                    {t("desk.list", { n: filteredAppointments.length })}
                  </h3>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
                  {/* Search box */}
                  <div className="w-full sm:w-52">
                    <Input
                      icon={Search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, phone, token"
                      className="min-h-[40px] text-xs"
                    />
                  </div>

                  {/* Session Filter */}
                  <div className="w-32">
                    <Select
                      value={filterSession}
                      onChange={(e) => setFilterSession(e.target.value)}
                      className="min-h-[40px] text-xs py-1.5"
                    >
                      <option value="ALL">{t("desk.allSessions")}</option>
                      <option value="MORNING">{t("session.morning")}</option>
                      <option value="EVENING">{t("session.evening")}</option>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="w-32">
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="min-h-[40px] text-xs py-1.5"
                    >
                      <option value="ALL">{t("desk.allStatuses")}</option>
                      <option value="WAITING">{t("desk.waiting")}</option>
                      <option value="CALLED">{t("desk.called")}</option>
                      <option value="COMPLETED">{t("desk.completed")}</option>
                      <option value="SKIPPED">{t("desk.skipped")}</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Mobile View: Stacked Patient Cards */}
              <div className="space-y-3 md:hidden">
                {filteredAppointments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--fg-muted)]">
                    No appointments match the current filter.
                  </div>
                ) : (
                  filteredAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#14213D] dark:text-[#CFE0F3] text-base bg-[#CFE0F3]/30 px-2 py-0.5 rounded-lg border border-[var(--border)]">
                            #{a.token_number}
                          </span>
                          <div>
                            <h4 className="font-bold text-[var(--fg)] text-sm">
                              {a.patient_name}
                            </h4>
                            <span className="text-[var(--fg-muted)] text-[11px]">
                              {a.age} Yrs &bull; {a.gender} &bull; {a.city}
                            </span>
                          </div>
                        </div>

                        <Badge
                          tone={
                            a.status === "CALLED"
                              ? "live"
                              : a.status === "WAITING"
                                ? "warning"
                                : a.status === "COMPLETED"
                                  ? "success"
                                  : "danger"
                          }
                          pulse={a.status === "CALLED"}
                        >
                          {a.status === "CALLED"
                            ? "In Cabin"
                            : a.status === "WAITING"
                              ? "Waiting"
                              : a.status === "COMPLETED"
                                ? "Completed"
                                : "Skipped"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--fg-muted)] pt-2 border-t border-[var(--border)] gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={a.session === "MORNING" ? "morning" : "evening"}>
                            {a.session === "MORNING" ? "Morning" : "Evening"}
                          </Badge>
                          <span className="font-medium">{a.time_slot}</span>
                        </div>
                        <span className="font-mono">{a.phone_number}</span>
                      </div>

                      {a.reason && (
                        <p className="text-[11px] text-[var(--fg-muted)] italic truncate">
                          Reason: {a.reason}
                        </p>
                      )}

                      {/* Row actions */}
                      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
                        {a.status === "WAITING" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              await doctorCallNext();
                              speakTokenAnnouncement(a.token_number, a.patient_name);
                              loadTodayAppointments();
                              onRefreshStatus?.();
                            }}
                          >
                            <Volume2 className="h-4 w-4" />
                            <span>Call into Cabin</span>
                          </Button>
                        )}
                        {a.status === "CALLED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full bg-[#183D6D] hover:bg-[#122E52]"
                            onClick={() => {
                              setNotesModal({
                                open: true,
                                apptId: a.id,
                                patientName: a.patient_name,
                                notes: a.prescription_notes || "",
                              });
                            }}
                          >
                            <CircleCheck className="h-4 w-4" />
                            <span>Complete Consultation</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Full Responsive Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-2)] text-[var(--fg-muted)] font-bold uppercase tracking-wider border-y border-[var(--border)]">
                    <tr>
                      <th className="py-3 px-3">Token</th>
                      <th className="py-3 px-3">Patient Name</th>
                      <th className="py-3 px-3">Session & Slot</th>
                      <th className="py-3 px-3">Phone & City</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[var(--fg-muted)]">
                          No appointments match the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-[var(--surface-2)]/60 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-[#14213D] dark:text-[#CFE0F3] text-sm">
                              #{a.token_number}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[var(--fg)] block">
                              {a.patient_name}
                            </span>
                            <span className="text-[var(--fg-muted)] text-[11px]">
                              {a.age} Yrs &bull; {a.gender}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge tone={a.session === "MORNING" ? "morning" : "evening"}>
                              {a.session === "MORNING" ? "Morning" : "Evening"}
                            </Badge>
                            <span className="text-[var(--fg-muted)] block text-[11px] mt-0.5">
                              {a.time_slot}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[var(--fg)] font-medium font-mono block">
                              {a.phone_number}
                            </span>
                            <span className="text-[var(--fg-muted)] text-[11px]">
                              {a.city}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-[150px] truncate text-[var(--fg-secondary)]">
                            {a.reason}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              tone={
                                a.status === "CALLED"
                                  ? "live"
                                  : a.status === "WAITING"
                                    ? "warning"
                                    : a.status === "COMPLETED"
                                      ? "success"
                                      : "danger"
                              }
                              pulse={a.status === "CALLED"}
                            >
                              {a.status === "CALLED"
                                ? "In Cabin"
                                : a.status === "WAITING"
                                  ? "Waiting"
                                  : a.status === "COMPLETED"
                                    ? "Completed"
                                    : "Skipped"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {a.status === "WAITING" && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-8 py-1 px-3 text-[11px]"
                                  onClick={async () => {
                                    await doctorCallNext();
                                    speakTokenAnnouncement(a.token_number, a.patient_name);
                                    loadTodayAppointments();
                                    onRefreshStatus?.();
                                  }}
                                >
                                  Call
                                </Button>
                              )}
                              {a.status === "CALLED" && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-8 py-1 px-3 text-[11px] bg-[#183D6D] hover:bg-[#122E52]"
                                  onClick={() => {
                                    setNotesModal({
                                      open: true,
                                      apptId: a.id,
                                      patientName: a.patient_name,
                                      notes: a.prescription_notes || "",
                                    });
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Prescription / Consultation Notes Modal */}
      <Modal
        open={notesModal.open}
        onClose={() => setNotesModal({ open: false, apptId: null, patientName: "", notes: "" })}
        title={`Complete Consultation: ${notesModal.patientName}`}
        subtitle="Add clinical notes or prescription advice for the patient's record."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[var(--fg)] mb-1.5">
              Doctor's Prescription & Clinical Notes
            </label>
            <textarea
              rows={4}
              value={notesModal.notes}
              onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              placeholder="e.g. Paracetamol 650mg TDS x 3 days, rest, review in 48 hours..."
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3.5 text-xs text-[var(--fg)] outline-none focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setNotesModal({ open: false, apptId: null, patientName: "", notes: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitCompleteWithNotes}
            >
              <Check className="h-4 w-4" />
              <span>Mark Completed</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Skip Patient Confirmation Modal */}
      <Modal
        open={skipConfirmModal.open}
        onClose={() =>
          setSkipConfirmModal({ open: false, apptId: null, patientName: "", tokenNumber: "" })
        }
        title="Confirm Mark Absent / Skip"
        subtitle="This will advance the queue and mark the patient's token as skipped."
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200">
            Are you sure you want to skip <strong>Token #{skipConfirmModal.tokenNumber} ({skipConfirmModal.patientName})</strong>? You can still recall them later if they arrive at the desk.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setSkipConfirmModal({ open: false, apptId: null, patientName: "", tokenNumber: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmSkip}
            >
              <SkipForward className="h-4 w-4" />
              <span>Skip Patient</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Walk-in Registration Modal */}
      <Modal
        open={showWalkinModal}
        onClose={() => setShowWalkinModal(false)}
        title="New Walk-in Patient (Reception Desk)"
        subtitle="Issue an immediate token for an offline patient standing at the clinic reception."
      >
        <form onSubmit={handleWalkinSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[var(--fg)] mb-1">
              Patient Full Name *
            </label>
            <Input
              required
              value={walkinData.patient_name}
              error={Boolean(walkinErrors.name)}
              onChange={(e) =>
                setWalkinData({ ...walkinData, patient_name: e.target.value })
              }
              placeholder="e.g. Ramesh Patel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Mobile Number *
              </label>
              <Input
                type="tel"
                prefix="+91"
                required
                maxLength={10}
                value={walkinData.phone_number}
                error={Boolean(walkinErrors.phone)}
                onChange={(e) =>
                  setWalkinData({
                    ...walkinData,
                    phone_number: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="10-digit number"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Age *
              </label>
              <Input
                type="number"
                required
                min={1}
                max={120}
                value={walkinData.age}
                error={Boolean(walkinErrors.age)}
                onChange={(e) =>
                  setWalkinData({ ...walkinData, age: e.target.value })
                }
                placeholder="Years"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Session
              </label>
              <Select
                value={walkinData.session}
                onChange={(e) =>
                  setWalkinData({ ...walkinData, session: e.target.value })
                }
              >
                <option value="MORNING">Morning Session</option>
                <option value="EVENING">Evening Session</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                City / Town
              </label>
              <Input
                value={walkinData.city}
                onChange={(e) =>
                  setWalkinData({ ...walkinData, city: e.target.value })
                }
                placeholder="Surat"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg)] mb-1">
              Reason for Visit
            </label>
            <Input
              value={walkinData.reason}
              onChange={(e) =>
                setWalkinData({ ...walkinData, reason: e.target.value })
              }
              placeholder="e.g. Fever checkup"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setShowWalkinModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
            >
              <Ticket className="h-4 w-4" />
              <span>Issue Token Slip</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clinic Settings & Timings Modal */}
      <Modal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Clinic Timings & Capacity Settings"
        subtitle="Configure patient quotas, operational session hours, and consultation speed."
      >
        <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Morning Patient Limit
              </label>
              <Input
                type="number"
                min={1}
                value={editSettings.morning_patient_limit}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    morning_patient_limit: parseInt(e.target.value) || 50,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Evening Patient Limit
              </label>
              <Input
                type="number"
                min={1}
                value={editSettings.evening_patient_limit}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    evening_patient_limit: parseInt(e.target.value) || 50,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Morning Start Time
              </label>
              <Input
                value={editSettings.morning_start_time}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    morning_start_time: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Morning End Time
              </label>
              <Input
                value={editSettings.morning_end_time}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    morning_end_time: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Evening Start Time
              </label>
              <Input
                value={editSettings.evening_start_time}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    evening_start_time: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--fg)] mb-1">
                Evening End Time
              </label>
              <Input
                value={editSettings.evening_end_time}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    evening_end_time: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fg)] mb-1">
              Average Consultation Minutes Per Patient
            </label>
            <Input
              type="number"
              min={1}
              value={editSettings.avg_consultation_time_minutes}
              onChange={(e) =>
                setEditSettings({
                  ...editSettings,
                  avg_consultation_time_minutes: parseInt(e.target.value) || 5,
                })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setShowSettingsModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
