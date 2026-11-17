import { useState } from "react";
import {
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Printer,
  User,
  Phone,
  MapPin,
  HeartPulse,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  CalendarPlus,
  Share2,
  ArrowLeft,
  Cross,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { bookAppointment } from "../api";
import { useI18n } from "../context/I18nContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "./PageHeader";
import { Badge, Button, Card, Input, Select, Stepper } from "./ui";

const EVENING_SLOTS = [
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
];

const COMMON_REASONS = [
  "General Health Checkup",
  "Viral Fever / Cold",
  "BP & Diabetes Check",
  "Routine Follow-up",
  "Joint / Body Pain",
  "Pediatric Consultation",
];

function downloadCalendarInvite(appointment, clinicName) {
  const datePart = appointment.appointment_date || new Date().toISOString().slice(0, 10);
  const timeText = appointment.estimated_time || appointment.time_slot || "09:00 AM";
  const match = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const hour12 = Number(match?.[1] || 9);
  const minute = Number(match?.[2] || 0);
  const hour24 = (hour12 % 12) + (/PM/i.test(match?.[3] || "") ? 12 : 0);
  const [year, month, day] = datePart.split("-").map(Number);
  const start = new Date(year, month - 1, day, hour24, minute);
  const end = new Date(start.getTime() + 20 * 60 * 1000);

  const format = (value) => [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
    "T",
    String(value.getHours()).padStart(2, "0"),
    String(value.getMinutes()).padStart(2, "0"),
    "00",
  ].join("");

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gurukrupa Clinic//Appointment//EN",
    "BEGIN:VEVENT",
    `UID:${appointment.token_number}-${datePart}@gurukrupa.clinic`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `SUMMARY:${clinicName || "Gurukrupa Clinic"} · Token #${appointment.token_number}`,
    `DESCRIPTION:${appointment.session} Session Consultation · Time: ${timeText} · Patient: ${appointment.patient_name}`,
    `LOCATION:Gurukrupa Clinic, Doctor Cabin 1, Surat`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `gurukrupa-token-${appointment.token_number}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BookingForm({
  initialSession = "MORNING",
  initialSlot = null,
  statusData,
  settings,
  onTrackAppointment,
}) {
  const { t } = useI18n();
  const { toast } = useToast();

  const morningBooked = statusData?.morning_booked || 0;
  const morningLimit = statusData?.morning_limit || 50;
  const isMorningFull = statusData?.morning_full || morningBooked >= morningLimit;

  const [session, setSession] = useState(
    isMorningFull && initialSession === "MORNING" ? "EVENING" : initialSession
  );
  const [preferredSlot, setPreferredSlot] = useState(initialSlot || "05:00 PM");
  const [bookingStep, setBookingStep] = useState(0);

  const [formData, setFormData] = useState({
    patient_name: "",
    phone_number: "",
    age: "",
    gender: "Male",
    city: "Surat",
    reason: "General Health Checkup",
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bookedSlip, setBookedSlip] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const eveningRemaining = Math.max(0, (statusData?.evening_limit || 50) - (statusData?.evening_booked || 0));
  const morningRemaining = Math.max(0, morningLimit - morningBooked);

  const validateStep = (step) => {
    const errors = {};
    if (step === 0) {
      if (session === "MORNING" && isMorningFull) {
        errors.session = t("live.morningFullBody");
      }
    } else if (step === 1) {
      if (session === "EVENING" && !preferredSlot) {
        errors.slot = "Please pick an evening time slot.";
      }
    } else if (step === 2) {
      if (!formData.patient_name.trim()) {
        errors.patient_name = t("toast.nameReq");
      } else if (formData.patient_name.trim().length < 2) {
        errors.patient_name = "Please enter a valid full name.";
      }

      const phoneClean = formData.phone_number.replace(/\D/g, "");
      if (!phoneClean) {
        errors.phone_number = t("toast.phoneReq");
      } else if (phoneClean.length !== 10) {
        errors.phone_number = "Mobile number must be exactly 10 digits.";
      }

      const ageNum = Number(formData.age);
      if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = t("toast.ageReq");
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(bookingStep)) {
      setBookingStep((prev) => Math.min(3, prev + 1));
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setBookingStep((prev) => Math.max(0, prev - 1));
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bookingStep < 3) return;
    if (loading) return;

    if (!validateStep(2)) {
      setBookingStep(2);
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const payload = {
        patient_name: formData.patient_name.trim(),
        phone_number: formData.phone_number.replace(/\D/g, ""),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        city: formData.city.trim() || "Surat",
        reason: formData.reason.trim() || "General Consultation",
        session,
        preferred_time_slot: session === "EVENING" ? preferredSlot : null,
      };

      const result = await bookAppointment(payload);
      setBookedSlip(result);
      toast("Token confirmed successfully!", "success");

      try {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#E4572E", "#F4A62A", "#14213D", "#CFE0F3"],
          });
        }
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      if (err.detail && typeof err.detail === "object") {
        setErrorMessage(err.detail);
      } else if (err.detail) {
        setErrorMessage({ message: err.detail });
      } else {
        setErrorMessage({ message: t("toast.bookErr") });
      }
      toast(t("toast.bookErr"), "error");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION SLIP SCREEN
  if (bookedSlip) {
    const isMorning = bookedSlip.session === "MORNING";
    const clinicName = settings?.clinic_name || "Gurukrupa Clinic";
    const doctorName = settings?.doctor_name || "Dr. Gitendra Patel";

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:py-6">
        <PageHeader title={t("book.confirmed")} current={t("nav.book")} />

        {/* Printable Verification Slip Card */}
        <div
          id="printable-slip"
          className="relative overflow-hidden rounded-2xl border-2 border-[#14213D] bg-white p-5 sm:p-8 text-[#14213D] shadow-[var(--shadow-lift)]"
        >
          {/* Header watermark/seal */}
          <div className="border-b border-[#EAE2D3] pb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14213D] text-[#FBF7F0] shadow-sm">
              <Cross className="h-7 w-7 text-[#E4572E]" strokeWidth={2.4} />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#14213D] tracking-tight">
              {clinicName}
            </h2>
            <p className="text-xs text-[#5B6475] mt-0.5 font-medium">
              {doctorName} &bull; Cabin 1 &bull; Surat, Gujarat
            </p>
            <div className="mt-3 flex justify-center">
              <Badge tone="available" className="px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[#183D6D]" strokeWidth={2} />
                <span>{t("book.confirmed")}</span>
              </Badge>
            </div>
          </div>

          {/* Hero Token Number Box in Deep Ink */}
          <div className="my-6 rounded-2xl bg-[#14213D] p-6 text-center text-[#FBF7F0] shadow-md border border-[#14213D]">
            <span className="text-[11px] font-bold tracking-widest text-[#F4A62A] uppercase">
              {t("book.yourToken")}
            </span>
            <div className="font-display my-2 text-6xl sm:text-7xl font-normal text-[#E4572E] tracking-tight drop-shadow-sm">
              #{bookedSlip.token_number}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#CFE0F3]">
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                {t("book.session")}: {isMorning ? t("common.morning") : t("common.evening")}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                {t("book.slot")}: {bookedSlip.estimated_time || bookedSlip.time_slot}
              </span>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 pb-6 text-sm sm:grid-cols-2">
            <SlipField label={t("book.nameLabel")} value={bookedSlip.patient_name} />
            <SlipField label={t("book.mobile")} value={`+91 ${bookedSlip.phone_number}`} />
            <SlipField
              label={t("book.ageGender")}
              value={`${bookedSlip.age} ${t("book.years")} • ${bookedSlip.gender}`}
            />
            <SlipField label={t("book.city")} value={bookedSlip.city || "Surat"} />
            <SlipField label={t("book.date")} value={bookedSlip.appointment_date} />
            <SlipField label={t("book.reason")} value={bookedSlip.reason} />
          </div>

          {/* Hospital guidelines */}
          <div className="mt-5 space-y-2 rounded-xl border border-[#EAE2D3] bg-[#FBF7F0] p-4 text-xs text-[#5B6475]">
            <p className="flex items-center gap-1.5 font-bold text-[#14213D]">
              <ShieldCheck className="h-4 w-4 text-[#E4572E]" strokeWidth={2} />
              <span>{t("book.guidelines")}</span>
            </p>
            <p>1. {t("book.g1")}</p>
            <p>2. {t("book.g2")}</p>
          </div>
        </div>

        {/* Action Controls for Patient */}
        <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1 sm:flex-initial"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" strokeWidth={2} />
            <span>{t("book.print")}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="flex-1 sm:flex-initial"
            onClick={() => downloadCalendarInvite(bookedSlip, clinicName)}
          >
            <CalendarPlus className="h-4 w-4 text-[#183D6D]" strokeWidth={2} />
            <span>{t("book.addCalendar")}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="flex-1 sm:flex-initial"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(
                  `*Gurukrupa Clinic Appointment Confirmed*\nToken: #${bookedSlip.token_number}\nPatient: ${bookedSlip.patient_name}\nSession: ${bookedSlip.session} (${bookedSlip.estimated_time || bookedSlip.time_slot})\nDate: ${bookedSlip.appointment_date}`
                )}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <Share2 className="h-4 w-4 text-[#E4572E]" strokeWidth={2} />
            <span>{t("book.shareWhatsApp")}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => onTrackAppointment(bookedSlip.token_number)}
          >
            <Search className="h-4 w-4" strokeWidth={2} />
            <span>{t("book.track")}</span>
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => {
              setBookedSlip(null);
              setBookingStep(0);
              setFormData({
                patient_name: "",
                phone_number: "",
                age: "",
                gender: "Male",
                city: "Surat",
                reason: "General Health Checkup",
              });
            }}
          >
            <span>{t("book.another")}</span>
          </Button>
        </div>
      </div>
    );
  }

  // BOOKING FORM WIZARD
  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t("book.title")}
        subtitle={t("book.subtitle")}
        current={t("nav.book")}
      />

      {/* Quota error or Morning Full notification */}
      {errorMessage && (
        <Card className="border-rose-300 bg-rose-50 p-4 sm:p-5 dark:border-rose-500/30 dark:bg-rose-950/40">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-rose-950 dark:text-rose-100 text-sm sm:text-base">
                {errorMessage.error_code === "MORNING_FULL"
                  ? t("book.morningFullTitle")
                  : t("book.notice")}
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-rose-800 dark:text-rose-200">
                {errorMessage.message || t("live.morningFullBody")}
              </p>
              {errorMessage.error_code === "MORNING_FULL" && (
                <Button
                  variant="evening"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSession("EVENING");
                    setErrorMessage(null);
                  }}
                >
                  <Moon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>{t("book.switchEvening")}</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Responsive 2-Column layout: Wizard on left, Live Summary on right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Step-by-Step Form Container (2 Cols) */}
        <Card className="p-5 sm:p-8 lg:col-span-2 space-y-6">
          {/* Stepper Header */}
          <Stepper
            current={bookingStep}
            steps={[
              { label: t("book.flowSession") },
              { label: t("book.flowSlot") },
              { label: t("book.flowPatient") },
              { label: t("book.flowConfirm") },
            ]}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 0: SESSION SELECTION */}
            {bookingStep === 0 && (
              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                    {t("book.stepSession")}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Choose whether you would like to visit in the morning or evening hours.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Morning Session Option */}
                  <div
                    onClick={() => {
                      if (isMorningFull) {
                        setErrorMessage({
                          error_code: "MORNING_FULL",
                          message: t("live.morningFullBody"),
                        });
                      } else {
                        setSession("MORNING");
                        setErrorMessage(null);
                      }
                    }}
                    className={`relative rounded-xl border-2 p-5 text-left transition-all cursor-pointer ${
                      session === "MORNING"
                        ? "border-[#F4A62A] bg-[#F4A62A]/10 ring-2 ring-[#F4A62A]/20"
                        : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[#F4A62A]/40"
                    } ${isMorningFull ? "border-dashed opacity-75" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4A62A]/20 text-[#B87104] dark:text-[#F4A62A]">
                          <Sun className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--fg)]">
                            {t("common.morning")}
                          </h4>
                          <span className="text-xs text-[var(--fg-muted)] font-medium">
                            {settings?.morning_start_time || "09:00 AM"} –{" "}
                            {settings?.morning_end_time || "01:00 PM"}
                          </span>
                        </div>
                      </div>
                      <Badge tone={isMorningFull ? "danger" : "morning"}>
                        {isMorningFull
                          ? "50/50 Full"
                          : t("live.slotsLeft", { n: morningRemaining })}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-[var(--fg-muted)] leading-relaxed">
                      {isMorningFull ? t("book.morningBlocked") : t("book.morningNote")}
                    </p>
                  </div>

                  {/* Evening Session Option */}
                  <div
                    onClick={() => {
                      setSession("EVENING");
                      setErrorMessage(null);
                    }}
                    className={`relative rounded-xl border-2 p-5 text-left transition-all cursor-pointer ${
                      session === "EVENING"
                        ? "border-[#14213D] dark:border-[#CFE0F3] bg-[#CFE0F3]/30 ring-2 ring-[#14213D]/20"
                        : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[#14213D]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0F3] text-[#183D6D]">
                          <Moon className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--fg)]">
                            {t("common.evening")}
                          </h4>
                          <span className="text-xs text-[var(--fg-muted)] font-medium">
                            {settings?.evening_start_time || "04:30 PM"} –{" "}
                            {settings?.evening_end_time || "08:30 PM"}
                          </span>
                        </div>
                      </div>
                      <Badge tone="evening">
                        {t("live.slotsLeft", { n: eveningRemaining })}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-[#183D6D] dark:text-[#CFE0F3] leading-relaxed font-medium">
                      {t("book.eveningNote")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: TIME SLOT */}
            {bookingStep === 1 && (
              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                    {t("book.flowSlot")}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    {session === "MORNING"
                      ? "Morning tokens are sequenced automatically on arrival order."
                      : "Choose your preferred evening consultation window."}
                  </p>
                </div>

                {session === "MORNING" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/30 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold text-sm">
                      <Sun className="h-5 w-5 text-amber-500" />
                      <span>{t("book.morningAutoSlot")}</span>
                    </div>
                    <p className="text-xs text-amber-900/80 dark:text-amber-300 leading-relaxed">
                      Consultation window: {settings?.morning_start_time || "09:00 AM"} to{" "}
                      {settings?.morning_end_time || "01:00 PM"}. Your exact token number and estimated consultation time will be generated upon confirmation.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/20 space-y-3">
                    <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                      {t("book.chooseSlot")}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {EVENING_SLOTS.map((slot) => {
                        const isSelected = preferredSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setPreferredSlot(slot)}
                            className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm ring-2 ring-indigo-500/30 scale-[1.02]"
                                : "border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur-md text-[var(--fg)] hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                      {t("book.selectedTime", { slot: preferredSlot })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PATIENT DETAILS FORM */}
            {bookingStep === 2 && (
              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                    {t("book.stepInfo")}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Please provide accurate patient details for clinic registration.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Full Name */}
                  <FormField label={t("book.name")} error={formErrors.patient_name} required>
                    <Input
                      icon={User}
                      required
                      value={formData.patient_name}
                      error={Boolean(formErrors.patient_name)}
                      onChange={(e) =>
                        setFormData({ ...formData, patient_name: e.target.value })
                      }
                      placeholder={t("book.namePh")}
                    />
                  </FormField>

                  {/* Phone with +91 validation */}
                  <FormField label={t("book.phone")} error={formErrors.phone_number} required>
                    <Input
                      icon={Phone}
                      type="tel"
                      prefix="+91"
                      required
                      maxLength={10}
                      value={formData.phone_number}
                      error={Boolean(formErrors.phone_number)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder={t("book.phonePh")}
                    />
                  </FormField>

                  {/* Age & Gender in 2 columns */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t("book.age")} error={formErrors.age} required>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        required
                        value={formData.age}
                        error={Boolean(formErrors.age)}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        placeholder="Years"
                      />
                    </FormField>

                    <FormField label={t("book.gender")}>
                      <Select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value })
                        }
                      >
                        <option value="Male">{t("book.male")}</option>
                        <option value="Female">{t("book.female")}</option>
                        <option value="Other">{t("book.other")}</option>
                      </Select>
                    </FormField>
                  </div>

                  {/* City */}
                  <FormField label={t("book.city")}>
                    <Input
                      icon={MapPin}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder={t("book.cityPh")}
                    />
                  </FormField>
                </div>

                {/* Reason for Visit + Quick Select pills */}
                <div>
                  <FormField label={t("book.reason")}>
                    <Input
                      icon={HeartPulse}
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      placeholder={t("book.reasonPh")}
                    />
                  </FormField>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {COMMON_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, reason: r })}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                          formData.reason === r
                            ? "border-[#E4572E] bg-[#E4572E]/10 text-[#E4572E] dark:bg-[#E4572E]/20 dark:text-[#F4A62A]"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & CONFIRM */}
            {bookingStep === 3 && (
              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                    {t("book.reviewTitle")}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Please double-check your appointment details before issuing token.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <SlipField
                      label={t("book.session")}
                      value={session === "MORNING" ? t("common.morning") : t("common.evening")}
                    />
                    <SlipField
                      label={t("book.slot")}
                      value={
                        session === "EVENING"
                          ? preferredSlot
                          : `${settings?.morning_start_time || "09:00 AM"} – ${settings?.morning_end_time || "01:00 PM"}`
                      }
                    />
                    <SlipField label={t("book.nameLabel")} value={formData.patient_name} />
                    <SlipField label={t("book.mobile")} value={`+91 ${formData.phone_number}`} />
                    <SlipField
                      label={t("book.ageGender")}
                      value={`${formData.age} ${t("book.years")} · ${formData.gender}`}
                    />
                    <SlipField label={t("book.reason")} value={formData.reason || "General Checkup"} />
                  </div>
                </div>
              </div>
            )}

            {/* STEPPER NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              {bookingStep > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handlePrevStep}
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  <span>{t("book.back")}</span>
                </Button>
              ) : (
                <div />
              )}

              {bookingStep < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={session === "MORNING" && isMorningFull}
                  onClick={handleNextStep}
                >
                  <span>{t("book.continue")}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading || (session === "MORNING" && isMorningFull)}
                  className="shadow-md"
                >
                  {!loading && <Sparkles className="h-5 w-5 text-amber-300" strokeWidth={2} />}
                  <span>
                    {loading
                      ? t("book.generating")
                      : session === "MORNING"
                        ? t("book.confirmMorning")
                        : t("book.confirmEvening", { slot: preferredSlot })}
                  </span>
                  {!loading && <ArrowRight className="h-5 w-5" strokeWidth={2} />}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Sticky Live Summary Sidebar on Desktop (1 Col) */}
        <div className="space-y-4">
          <Card className="p-5 sm:p-6 sticky top-24 space-y-4 border border-[#EAE2D3] dark:border-[#263654] bg-white dark:bg-[#18243F]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Booking Summary
              </span>
              <Badge tone="live" pulse>
                Live Quota
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-[var(--fg-muted)]">Selected Session:</span>
                <strong className="text-[var(--fg)] flex items-center gap-1">
                  {session === "MORNING" ? (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  <span>{session === "MORNING" ? "Morning" : "Evening"}</span>
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-[var(--fg-muted)]">Time Slot:</span>
                <strong className="text-[var(--fg)]">
                  {session === "EVENING"
                    ? preferredSlot
                    : `${settings?.morning_start_time || "09:00 AM"} – ${settings?.morning_end_time || "01:00 PM"}`}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-[var(--fg-muted)]">Quota Remaining:</span>
                <span className="font-bold text-[#E4572E]">
                  {session === "MORNING"
                    ? `${morningRemaining} / ${morningLimit} slots`
                    : `${eveningRemaining} / 50 slots`}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span className="text-[var(--fg-muted)]">Consultation Cabin:</span>
                <span className="font-bold text-[var(--fg)]">Cabin 1 (Dr. Gitendra Patel)</span>
              </div>

              {formData.patient_name && (
                <div className="rounded-xl bg-[var(--surface-2)] p-2.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] block">
                    Patient In Progress
                  </span>
                  <div className="font-bold text-[var(--fg)] truncate">
                    {formData.patient_name}
                  </div>
                  {formData.phone_number && (
                    <div className="text-[11px] text-[var(--fg-muted)] font-mono">
                      +91 {formData.phone_number}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#CFE0F3]/40 p-3 text-[11px] text-[#183D6D] dark:bg-[#CFE0F3]/15 dark:text-[#CFE0F3] space-y-1 border border-[#B5CDE8] dark:border-[#CFE0F3]/30">
              <span className="font-bold block flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#E4572E]" />
                No advance fees required
              </span>
              <span>Free digital token allocation. Pay at reception desk only after consultation.</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[var(--fg)]">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}

function SlipField({ label, value }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <strong className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
        {value || "—"}
      </strong>
    </div>
  );
}
