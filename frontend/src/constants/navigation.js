import { Activity, Calendar, Search, Stethoscope, Tv } from "lucide-react";

export const PATIENT_TABS = [
  { id: "live-board", icon: Activity, labelKey: "nav.live" },
  { id: "book-appointment", icon: Calendar, labelKey: "nav.book" },
  { id: "my-token", icon: Search, labelKey: "nav.track" },
  { id: "tv-screen", icon: Tv, labelKey: "nav.tv" },
];

export const DOCTOR_TAB = {
  id: "doctor-panel",
  icon: Stethoscope,
  labelKey: "nav.desk",
  isStaffOnly: true,
};

export const ALL_TABS = [
  PATIENT_TABS[0],
  PATIENT_TABS[1],
  PATIENT_TABS[2],
  DOCTOR_TAB,
  PATIENT_TABS[3],
];

export const TABS = ALL_TABS;
