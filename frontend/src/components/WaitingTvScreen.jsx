import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Volume2,
  Maximize2,
  Minimize2,
  Stethoscope,
  Cross,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import { speakTokenAnnouncement } from "../api";

export default function WaitingTvScreen({
  statusData,
  settings,
  wsConnected,
  onExitTv,
}) {
  const reduceMotion = useReducedMotion();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [cursorHidden, setCursorHidden] = useState(false);

  // Live real-time clock updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hide mouse cursor after 4 seconds of idle activity (ideal for waiting room TVs)
  useEffect(() => {
    let timeoutId;
    const handleMouseMove = () => {
      setCursorHidden(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCursorHidden(true);
      }, 4000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  // Fullscreen trigger
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isMorning = statusData?.current_session === "MORNING";
  const clinicName = settings?.clinic_name || "Gurukrupa Clinic";
  const doctorName = settings?.doctor_name || "Dr. R. K. Patel (M.B.B.S., M.D.)";
  const servingToken = statusData?.current_serving_token;
  const servingPatient = statusData?.current_serving_patient_name;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#0E1628] text-white p-4 sm:p-6 md:p-8 select-none overflow-hidden font-sans ${
        cursorHidden ? "cursor-none" : ""
      }`}
    >
      {/* Ambient TV Background Animation with central pulse rings */}
      <AnimatedBackground variant="tv" />

      {/* Top TV Bar */}
      <header className="flex items-center justify-between border-b border-[#263654] pb-4 shrink-0 gap-4">
        {/* Brand & Doctor Credentials */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#E4572E] text-white shadow-lg shadow-[#E4572E]/25 shrink-0">
            <Cross className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-tight text-white">
                {clinicName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E4572E]/40 bg-[#E4572E]/15 px-3 py-0.5 text-xs font-bold text-[#E4572E]">
                <span className="h-2 w-2 rounded-full bg-[#E4572E] animate-ping" />
                Waiting Room TV Signage
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#CFE0F3] mt-0.5 font-medium flex items-center gap-2">
              <Stethoscope className="h-3.5 w-3.5 text-[#F4A62A]" />
              <span>{doctorName} &bull; Cabin 1 Consultation Room</span>
            </p>
          </div>
        </div>

        {/* Right Info: Session, Clock, Connection, Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Active Session Badge */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold ${
              isMorning
                ? "border-[#F4A62A]/40 bg-[#F4A62A]/15 text-[#F4A62A]"
                : "border-[#CFE0F3]/40 bg-[#CFE0F3]/15 text-[#CFE0F3]"
            }`}
          >
            {isMorning ? (
              <Sun className="h-4 w-4 text-[#F4A62A]" strokeWidth={2} />
            ) : (
              <Moon className="h-4 w-4 text-[#CFE0F3]" strokeWidth={2} />
            )}
            <span>{isMorning ? "Morning Session" : "Evening Session"}</span>
          </div>

          {/* Real-time Digital Clock */}
          <div className="text-right">
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-[#E4572E] tracking-wider">
              {currentTime}
            </div>
            <span className="text-[10px] sm:text-xs text-[#5B6475] font-medium">
              Live Clinic Clock
            </span>
          </div>

          {/* WebSocket Status */}
          <div
            className={`hidden lg:flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${
              wsConnected
                ? "border-[#263654] bg-[#14213D] text-[#CFE0F3]"
                : "border-amber-800 bg-amber-950/60 text-amber-200"
            }`}
          >
            {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>{wsConnected ? "Sync: Live" : "Reconnecting"}</span>
          </div>

          {/* Fullscreen & Exit controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-[#14213D] border border-[#263654] text-[#CFE0F3] hover:text-white hover:bg-[#18243F] transition cursor-pointer"
              title="Toggle Fullscreen TV Mode"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={onExitTv}
              className="px-3 py-2 rounded-xl bg-[#14213D] border border-[#263654] text-xs font-bold text-[#CFE0F3] hover:text-white hover:bg-[#18243F] transition cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main TV Center Stage: Viewport-scaled Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 my-auto items-stretch py-4">
        {/* Left 2 Cols: Giant Now Serving Cabin Stage */}
        <div className="lg:col-span-2 relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#263654] bg-[#14213D] p-6 sm:p-10 md:p-12 shadow-2xl">
          {/* Subtle Ambient Orbs */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#E4572E]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#F4A62A]/10 blur-3xl pointer-events-none" />

          {/* Header indicator */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E4572E]/40 bg-[#E4572E]/20 px-4 py-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#E4572E] shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E4572E] animate-ping" />
              <span>Please Proceed To Cabin 1</span>
            </span>

            <span className="rounded-xl bg-white/10 px-3 py-1 text-xs sm:text-sm font-semibold text-[#CFE0F3]">
              Doctor Consultation Cabin 1
            </span>
          </div>

          {/* Giant Now Serving Token Typography */}
          <div className="relative z-10 text-center py-6 sm:py-10">
            <motion.div
              key={servingToken || "none"}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
              className="text-[clamp(6rem,14vw,18rem)] font-black leading-none tracking-tight font-display text-[#E4572E] drop-shadow-[0_12px_45px_rgba(228,87,46,0.35)] select-none"
            >
              {servingToken ? `#${servingToken}` : "--"}
            </motion.div>

            <h2 className="mt-3 sm:mt-5 text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
              {servingPatient || "Doctor Consultation In Progress..."}
            </h2>

            <p className="mt-2 text-sm sm:text-base text-[#CFE0F3] font-medium max-w-xl mx-auto">
              Please carry your patient case file and proceed to Consultation Cabin 1.
            </p>
          </div>

          {/* Audio Chime Notification & Repeat Call */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-[#263654] pt-4 gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#CFE0F3] text-center sm:text-left">
              <Sparkles className="h-4 w-4 shrink-0 text-[#F4A62A]" />
              <span>Audio speech chime sounds automatically whenever a new token is announced</span>
            </div>

            {servingToken && (
              <button
                type="button"
                onClick={() => speakTokenAnnouncement(servingToken, servingPatient)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E4572E] hover:bg-[#CC4820] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#E4572E]/30 transition cursor-pointer"
              >
                <Volume2 className="h-4 w-4" />
                <span>Repeat Call Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming In Line Queue Strip */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#263654] bg-[#18243F] p-6 sm:p-7 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-[#263654] pb-3 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#F4A62A]" />
                <span>Upcoming In Line</span>
              </h3>
              <span className="text-xs sm:text-sm font-mono font-extrabold text-[#CFE0F3] bg-[#14213D] px-2.5 py-1 rounded-lg border border-[#263654]">
                Waiting: {statusData?.total_waiting || 0}
              </span>
            </div>

            {/* List of upcoming patients */}
            <div className="space-y-3">
              {statusData?.upcoming_tokens && statusData.upcoming_tokens.length > 0 ? (
                statusData.upcoming_tokens.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between rounded-2xl border border-[#263654] bg-[#14213D] p-3.5 transition hover:border-[#E4572E]/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18243F] font-bold text-xs text-[#CFE0F3] font-mono border border-[#263654]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-lg font-black font-mono text-[#E4572E] block leading-tight">
                          #{item.token_number}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white block truncate max-w-[150px]">
                          {item.patient_name}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-lg bg-[#18243F] px-2.5 py-1 text-xs font-semibold text-[#CFE0F3] font-mono border border-[#263654]">
                      ~{item.estimated_time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-[#5B6475] italic">
                  No upcoming patients waiting in queue.
                </div>
              )}
            </div>
          </div>

          {/* Consultations completed today stats */}
          <div className="mt-4 border-t border-[#263654] pt-4 flex items-center justify-between text-xs text-[#CFE0F3]">
            <span>Consultations Completed Today:</span>
            <strong className="text-base font-black text-[#F4A62A] font-mono">
              {statusData?.total_completed || 0}
            </strong>
          </div>
        </div>
      </main>

      {/* Bottom Running Announcements Ticker Tape */}
      <footer className="flex items-center gap-3 rounded-2xl border border-[#263654] bg-[#14213D] px-4 py-2.5 overflow-hidden shrink-0">
        <span className="shrink-0 rounded-lg bg-[#E4572E] px-3 py-1 text-xs font-black uppercase text-white">
          Clinic Notice
        </span>
        <div className="overflow-hidden whitespace-nowrap text-xs sm:text-sm font-medium text-[#CFE0F3]">
          <span className="inline-block animate-marquee">
            Gurukrupa Clinic &bull; Morning Session: {settings?.morning_start_time || "09:00 AM"} – {settings?.morning_end_time || "01:00 PM"} (Max 50 Patients) &bull; Evening Session: {settings?.evening_start_time || "04:30 PM"} – {settings?.evening_end_time || "08:30 PM"} &bull; Please report to the reception desk 15 minutes before your estimated time &bull; Clean hands save lives &bull; Digital online tokens live-synchronized &bull;
          </span>
        </div>
      </footer>
    </div>
  );
}
