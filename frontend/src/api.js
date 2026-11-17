const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000")
).replace(/\/$/, "");

export function getQueueWebSocketUrl() {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const url = new URL(API_BASE, origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/queue";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export async function fetchLiveStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error("Failed to fetch live status");
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function fetchAvailability(dateStr = null) {
  const url = dateStr ? `${API_BASE}/api/availability?date_str=${dateStr}` : `${API_BASE}/api/availability`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

export async function bookAppointment(data) {
  const res = await fetch(`${API_BASE}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw json;
  }
  return json;
}

export async function searchAppointment(query) {
  const res = await fetch(`${API_BASE}/api/appointments/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function fetchTodayAppointments(session = null, status = null) {
  let url = `${API_BASE}/api/appointments/today?`;
  if (session) url += `session=${session}&`;
  if (status) url += `status=${status}&`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch today appointments");
  return res.json();
}

export async function doctorCallNext() {
  const res = await fetch(`${API_BASE}/api/doctor/call-next`, { method: "POST" });
  return res.json();
}

export async function doctorRecall() {
  const res = await fetch(`${API_BASE}/api/doctor/recall`, { method: "POST" });
  return res.json();
}

export async function doctorComplete(apptId, notes = "") {
  const res = await fetch(`${API_BASE}/api/doctor/complete/${apptId}?notes=${encodeURIComponent(notes)}`, {
    method: "POST",
  });
  return res.json();
}

export async function doctorSkip(apptId) {
  const res = await fetch(`${API_BASE}/api/doctor/skip/${apptId}`, { method: "POST" });
  return res.json();
}

export async function updateDoctorStatus(status) {
  const res = await fetch(`${API_BASE}/api/doctor/status?status=${status}`, { method: "POST" });
  return res.json();
}

export async function switchSession(session) {
  const res = await fetch(`${API_BASE}/api/doctor/session?session=${session}`, { method: "POST" });
  return res.json();
}

// Audio chime using Web Audio API
export function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {
    console.error("Audio chime error:", e);
  }
}

// Speech announcement in English
export function speakTokenAnnouncement(token, patientName = "") {
  playChime();
  if ("speechSynthesis" in window) {
    setTimeout(() => {
      const text = `Token number ${token}. Patient ${patientName}. Please proceed to doctor consultation cabin.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }, 600);
  }
}
