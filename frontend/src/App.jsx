import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import AnimatedBackground from "./components/AnimatedBackground";
import StaffPinGate from "./components/StaffPinGate";
const LiveQueueBoard = lazy(() => import("./components/LiveQueueBoard"));
const BookingForm = lazy(() => import("./components/BookingForm"));
const MyTokenTracker = lazy(() => import("./components/MyTokenTracker"));
const DoctorPanel = lazy(() => import("./components/DoctorPanel"));
const WaitingTvScreen = lazy(() => import("./components/WaitingTvScreen"));
import { 
  fetchLiveStatus, 
  fetchSettings, 
  speakTokenAnnouncement, 
  playChime,
  getQueueWebSocketUrl,
} from "./api";

function ScreenLoading() {
  return (
    <div className="w-full space-y-5 px-4 sm:px-6 lg:px-8 py-6" role="status" aria-label="Loading page">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-[var(--surface-2)] motion-reduce:animate-none" />
      <div className="h-32 rounded-3xl bg-[var(--surface-2)] animate-pulse motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-2xl bg-[var(--surface-2)] animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const reduceMotion = useReducedMotion();
  const [currentTab, setCurrentTab] = useState("live-board");
  const [bookingSession, setBookingSession] = useState("MORNING");
  const [bookingSlot, setBookingSlot] = useState(null);
  const [trackQuery, setTrackQuery] = useState("");

  const [statusData, setStatusData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Responsive Sidebar States
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("gk-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Doctor & Staff Authentication State (Patients cannot see or access Doctor Desk)
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem("gk-doctor-auth") === "true";
    } catch {
      return false;
    }
  });
  const [showStaffPinModal, setShowStaffPinModal] = useState(false);

  const handleDoctorUnlock = () => {
    setIsDoctorAuthenticated(true);
    try {
      sessionStorage.setItem("gk-doctor-auth", "true");
    } catch {
      /* ignore */
    }
    setShowStaffPinModal(false);
    setCurrentTab("doctor-panel");
  };

  const handleDoctorLock = () => {
    setIsDoctorAuthenticated(false);
    try {
      sessionStorage.removeItem("gk-doctor-auth");
    } catch {
      /* ignore */
    }
    if (currentTab === "doctor-panel") {
      setCurrentTab("live-board");
    }
  };

  const handleSetCollapsed = (val) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem("gk-sidebar-collapsed", String(val));
    } catch {
      /* ignore */
    }
  };

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        fetchLiveStatus(),
        fetchSettings(),
      ]);
      setStatusData(statusRes);
      setSettings(settingsRes);
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void loadData();
  }, [loadData]);

  // WebSocket connection for real-time synchronization
  useEffect(() => {
    let reconnectTimeout = null;
    let stopped = false;

    const connectWebSocket = () => {
      if (stopped) return;
      const wsUrl = getQueueWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.data) {
            setStatusData(payload.data);
          }

          // If a patient was called or recalled, trigger audio announcement
          if (payload.type === "PATIENT_CALLED" || payload.type === "PATIENT_RECALLED") {
            const extra = payload.extra || {};
            if (extra.token_number) {
              speakTokenAnnouncement(extra.token_number, extra.patient_name || "");
            }
          } else if (payload.type === "NEW_APPOINTMENT_BOOKED") {
            playChime();
          }
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!stopped) reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      stopped = true;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Handlers for cross-component navigation
  const handleNavigateToBooking = (sessionType = "MORNING", preferredSlot = null) => {
    setBookingSession(sessionType);
    setBookingSlot(preferredSlot);
    setCurrentTab("book-appointment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTrackAppointment = (tokenOrPhone) => {
    setTrackQuery(tokenOrPhone);
    setCurrentTab("my-token");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If TV Screen mode is selected, show fullscreen waiting room view
  if (currentTab === "tv-screen") {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <WaitingTvScreen
          statusData={statusData}
          settings={settings}
          wsConnected={wsConnected}
          onExitTv={() => setCurrentTab("live-board")}
        />
      </Suspense>
    );
  }

  return (
    <div className="app-shell relative min-h-screen min-w-0 flex bg-[var(--bg)] text-[var(--fg)]">
      {/* Animated Background Variant (Mesh for Doctor Desk, Aurora for Patient Pages) */}
      <AnimatedBackground
        variant={currentTab === "doctor-panel" ? "mesh" : "aurora"}
        showMedicalShapes={currentTab === "live-board"}
      />

      {/* Left Sidebar Header (Desktop Sticky & Mobile Drawer) - Doctor Desk hidden from patients */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        statusData={statusData}
        settings={settings}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDoctorAuthenticated={isDoctorAuthenticated}
        onOpenStaffModal={() => setShowStaffPinModal(true)}
        onLockStaffMode={handleDoctorLock}
      />

      {/* Right Column: Top Header + Main Content + Footer */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          statusData={statusData}
          settings={settings}
          wsConnected={wsConnected}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 w-full min-w-0 px-0 pb-28 pt-4 sm:pb-10 md:pt-6 md:pb-24 lg:pb-10">
          <Suspense fallback={<ScreenLoading />}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="w-full min-w-0"
                key={currentTab}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
                {currentTab === "live-board" && (
                  <LiveQueueBoard
                    statusData={statusData}
                    settings={settings}
                    _wsConnected={wsConnected}
                    onNavigateToBooking={handleNavigateToBooking}
                  />
                )}

                {currentTab === "book-appointment" && (
                  <BookingForm
                    initialSession={bookingSession}
                    initialSlot={bookingSlot}
                    statusData={statusData}
                    settings={settings}
                    onTrackAppointment={handleTrackAppointment}
                  />
                )}

                {currentTab === "my-token" && (
                  <MyTokenTracker
                    key={trackQuery}
                    initialQuery={trackQuery}
                    statusData={statusData}
                  />
                )}

                {/* Doctor Panel is protected: only renders when authenticated; otherwise shows PIN gate */}
                {currentTab === "doctor-panel" && (
                  isDoctorAuthenticated ? (
                    <DoctorPanel
                      statusData={statusData}
                      settings={settings}
                      onRefreshStatus={loadData}
                    />
                  ) : (
                    <StaffPinGate
                      onSuccess={handleDoctorUnlock}
                      onCancel={() => setCurrentTab("live-board")}
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        <Footer
          settings={settings}
          onOpenStaffModal={() => setShowStaffPinModal(true)}
        />
      </div>

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isDoctorAuthenticated={isDoctorAuthenticated}
      />

      {/* Staff PIN Modal Dialog */}
      {showStaffPinModal && (
        <StaffPinGate
          isModal
          onSuccess={handleDoctorUnlock}
          onCancel={() => setShowStaffPinModal(false)}
        />
      )}
    </div>
  );
}
