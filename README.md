# Gurukrupa Clinic (Queue & Appointment Management System)

A clinic queue management and online appointment system built with FastAPI, PostgreSQL, React, and Tailwind CSS.

---

## 🎨 Warm Care Design System

The entire front-end user experience has been redesigned following the **"Warm Care"** design system — crafted to feel authentic, calm, tactile, and trustworthy for an Indian neighbourhood clinic, deliberately avoiding the generic "AI-generated" look.

### 1. Palette: Zero Green Policy
All green, emerald, and teal tones have been replaced across all pages and components with the **Warm Care** tokens:

- **Ink (Primary Dark, Text, Hero Cards)**: `#14213D`
- **Cream (Page Background)**: `#FBF7F0`
- **Surface (Cards & Panels)**: `#FFFFFF` with a crisp 1px border `#EAE2D3`
- **Coral (Primary Action, Now Serving Highlight)**: `#E4572E`
- **Saffron (Secondary Accent, Morning Session)**: `#F4A62A`
- **Sky (Soft Info, Evening Session)**: `#CFE0F3` (text `#183D6D`)
- **Muted Text**: `#5B6475`
- **Status Colors**: Available = Sky/Ink, Filling fast = Saffron, Full/Urgent = Coral, Closed = Neutral gray.
- **Dark Mode**: Ink background `#0E1628`, elevated cards `#18243F`, border `#263654`.

### 2. Hand-Crafted, Anti-AI Aesthetic
- **Tactile Paper Grain Texture**: Subtle CSS grain pattern (`.app-shell`) creating physical depth.
- **Flat Solid Surfaces**: High-clarity flat cards with fine 1px `#EAE2D3` borders rather than generic glassmorphism on every card (glass blur reserved strictly for the sticky navbar).
- **Strong Visual Hierarchy**: One dominant hero element per page (Deep Ink `#14213D` hero cards with giant Coral `#E4572E` tokens).
- **Characterful Typography**:
  - **Headings & Tokens**: `DM Serif Display` with tabular numerals
  - **Body & Forms**: `DM Sans` with clean geometric legibility
  - **Clock & Monospace Figures**: `JetBrains Mono`
- **Authentic Copy**: Human, neighbourhood-clinic copy with English, ગુજરાતી (Gujarati), and हिन्दी (Hindi) support.

### 3. Ambient Background (`<AnimatedBackground />`)
A lightweight, GPU-accelerated ambient component positioned behind page content (`position: fixed`, `z-index: -1`, `pointer-events: none`):

- **Variants**:
  - `aurora` (Patient Pages): Slow warm saffron and soft sky ambient drifts (30–45s loop) with `blur(80px)`.
  - `mesh` (Doctor & Reception Desk): Faint dotted paper grid, ensuring clinical tables and inputs stay 100% legible.
  - `tv` (Waiting Room TV): Deep ink canvas (`#0E1628`) with gentle coral and saffron ambient orbs.
  - `showMedicalShapes`: Clean, delicate ECG heartbeat line and gentle clinic marks at 5–8% opacity.

- **Animation Controls**:
  - Pause on hidden tab (`document.visibilitychange`).
  - Strict compliance with `prefers-reduced-motion` (shows static warm background).
  - Configurable speeds and intensities via CSS variables.

### 4. Layout: Collapsible Sidebar Header Navigation & Staff Privacy
- **Patient Privacy**: The Doctor Desk is strictly hidden from regular patient navigation. Patients only see the patient tabs:
  - *Live Token Board*
  - *Book Appointment*
  - *Track Queue*
  - *Waiting TV*
- **Doctor / Staff Access**: Authorized medical staff can access the Doctor Desk via a discrete *Staff Access* link (Sidebar or Footer) by entering the staff PIN (Default: `1234`).
- **Lock Protection**: Unauthenticated users trying to access the Doctor Desk view are intercepted by the *StaffPinGate*, preventing patients from viewing doctor controls. Doctors can click *Lock Doctor Desk* at any time to re-hide it.
- **Desktop (md / lg and up)**:
  - Sticky vertical navigation rail on the left.
  - Collapsible: switches between 260px expanded view and 72px icon rail with hover tooltips (`ChevronLeft` / `ChevronRight` toggle).
  - Includes Clinic Brand Header, Navigation items with active ink pill indicator, and Live serving token counter.
  - Persists collapsed state across browser refreshes in `localStorage`.
- **Mobile (< md)**:
  - Accessible off-canvas sliding drawer triggered from the top navbar hamburger button (`Menu` icon).
  - Mobile bottom nav bar displays only the 4 patient tabs for clean, thumb-friendly navigation.

### 5. Component Library (`src/components/ui/`)
- **Button**: Coral `#E4572E` primary, Deep Ink `#14213D` secondary, Saffron morning, Sky evening, with `active:scale-[0.97]` tactile press.
- **Card**: Flat solid surfaces with fine borders (`border-[#EAE2D3]`), dark ink variants, and subtle hover lift.
- **Badge / StatusPill**: Available (Sky/Ink), Morning/Filling fast (Saffron), Live/Urgent (Coral), Closed (Neutral).
- **Input & Select**: Coral focus rings (`ring-[#E4572E]`), fine borders, +91 phone formatting, and clear error hints.
- **Modal & Drawer**: Focus-trapped dialogs with keyboard ESC dismiss and warm borders.
- **Stepper & Timeline**: Visual progress trackers with Coral and Ink indicators.
- **Stat & TokenNumber**: Editorial serif display numerals with Coral pulse ring and call highlight flash.
- **ProgressBar**: Smooth-transitioning session capacity meters in Coral, Saffron, and Sky.

---

## 🌟 Pages Redesigned

1. **Live Token Board (`LiveQueueBoard.jsx`)**:
   - Hero "Now Serving" card in Deep Ink with giant Coral token number in `DM Serif Display`.
   - Live stat cards: Patients Waiting, Completed Today, Avg Consultation Time, Estimated Wait.
   - Upcoming queue preview strip with patient avatars.
   - Session cards: Morning (Saffron) and Evening (Sky) with circular progress meters and slot selection chips.
   - Quick "What is my queue number?" tracker widget with instant lookup.

2. **Book Online Appointment (`BookingForm.jsx`)**:
   - 4-step booking wizard with visual step indicator.
   - Session selection cards (Saffron Morning vs Sky Evening).
   - Form inputs with custom Coral focus rings and common reason chips.
   - Sticky summary panel and printable/downloadable appointment confirmation slip with QR and WhatsApp share.

3. **Track My Queue Number (`MyTokenTracker.jsx`)**:
   - Quick lookup by mobile or token number.
   - 5-step visual progress timeline (*Booked ➔ In Queue ➔ Next Up ➔ In Cabin ➔ Completed*).
   - Estimated wait time countdown, audio announcement chime toggle, and desktop notifications.

4. **Doctor & Reception Desk (`DoctorPanel.jsx`)**:
   - Collapsible navigation sidebar and consultation overview.
   - Hero Calling Box with Deep Ink panel, large Coral "Call Next (N)", "Recall (R)", "Complete (C)", and "Skip" shortcuts.
   - Hourly consultation volume analytics chart in Warm Coral.
   - Live queue table with instant search, session/status filters, walk-in patient modal, and clinical notes modal.

5. **Waiting Room TV Display (`WaitingTvScreen.jsx`)**:
   - High-contrast 1080p/4K display on Deep Ink `#0E1628`.
   - Giant "Now Serving" token in Coral `DM Serif Display` with pulsing cabin beacon.
   - Live digital clinic clock, session indicator, upcoming patient queue strip, and bottom running announcement ticker.
   - Idle cursor auto-hide (4 seconds) and 1-click fullscreen toggle.

---

## 🚀 Getting Started

### Backend Setup (FastAPI & PostgreSQL)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

### Frontend Setup (Vite, React 19, Tailwind CSS v4)
```bash
cd frontend
npm install
npm run dev
```

Visit the app at `http://localhost:3000`.
