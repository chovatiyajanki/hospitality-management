import { Activity, Calendar, Search, Stethoscope, Tv } from "lucide-react";

export const TABS = [
  { id: "live-board", icon: Activity, labelKey: "nav.live" },
  { id: "book-appointment", icon: Calendar, labelKey: "nav.book" },
  { id: "my-token", icon: Search, labelKey: "nav.track" },
  { id: "doctor-panel", icon: Stethoscope, labelKey: "nav.desk" },
  { id: "tv-screen", icon: Tv, labelKey: "nav.tv" },
];

