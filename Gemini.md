# 🧭 INSTRUCTION.md — Health Tracker App (Pixel 7, Expo, Local-First)

## Overview
This is a **personal health-tracking app** built by **Gnaneswar Lopinti** for self-quantification, wellness, and pattern analysis.  
It runs **only on a Pixel 7 (Android)** using **Expo + React Native (TypeScript)**.  
No public release — it’s a private, local-first application with optional free cloud sync.

---

## 🎯 Purpose
The app helps track and visualize:
- **Vitals:** blood pressure, pulse  
- **Symptoms:** migraine events & triggers  
- **Activity:** steps, workouts, gym sessions  
- **Lifestyle:** meals, meditation sessions, sleep, supplements  
- **Notes:** daily journal, mood, triggers  
- **Reminders:** medication & vitals tracking  

All data is **stored locally in SQLite** and can be exported as **CSV/JSON** to share with a doctor or family member.

---

## 🧱 Tech Stack

| Layer | Library / Tool | Notes |
|-------|----------------|-------|
| **Runtime** | Expo SDK (React Native + TypeScript) | Easiest single-dev workflow |
| **Navigation** | `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack` | Tabs + modal Add-BP flow |
| **Database** | `expo-sqlite` | Local-first structured storage |
| **Storage / Security** | `expo-secure-store`, `expo-local-authentication` | Biometrics & key storage |
| **UI / Animation** | `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `@expo/vector-icons` | Smooth micro-animations |
| **Forms** | `react-hook-form`, `zod` | Validation |
| **Notifications** | `expo-notifications`, `expo-task-manager` | Local reminders & offline alerts |
| **Export** | `expo-file-system`, `expo-sharing` | Share JSON/CSV backups |
| **Dev** | TypeScript, VSCode, Expo Go | Works offline on Pixel 7 |

---

## ⚙️ Folder Structure
src/
├─ components/ → reusable UI atoms (BigButton, RingProgress, etc.)
├─ screens/ → Today, AddBP, Journal, Meds, Profile (+ future)
├─ navigation/ → Tabs + Root stack (modal AddBP)
├─ services/ → db.ts (SQLite helpers), notifications.ts, utils
└─ theme/ → tokens.ts (design system)

---

## 🎨 Design Philosophy
- **Style:** Calm, minimal, Apple-Health-meets-Headspace aesthetic  
- **Theme:** Auto (dark/light), dark default  
- **Spacing:** 8-pt grid, generous whitespace  
- **Shapes:** Rounded corners (radius 16 px)  
- **Animations:** Subtle Lottie/Reanimated transitions only  
- **Typography:** Clean sans-serif (font TBD), large readable numbers  
- **Tone:** Data-driven but friendly (non-clinical microcopy)

---

## 📋 Core Screens

| Screen | Description |
|---------|--------------|
| **Today** | Dashboard summary (steps ring, latest BP, meds due) |
| **AddBP (modal)** | Form for systolic/diastolic/pulse, saves to SQLite |
| **Journal** | Daily notes & tags (placeholder) |
| **Meds** | Medication list, reminders, logs (placeholder) |
| **Profile** | Settings, export, biometric lock (placeholder) |

---

## 💾 Data Model (SQLite)

Main tables:
- `bp_readings` (id, systolic, diastolic, pulse, measured_at, note)
- `migraines`
- `steps`
- `workouts`
- `meals`
- `medications`
- `medication_logs`
- `meditation_sessions`
- `journals`
- `meta_sync` (for backup metadata)

All timestamps are **Unix ms (UTC)**.  
Local single-user model (`user_id = 'local-user'`).

---

## 🔐 Privacy & Sync
- Default **offline-first**; all data stays on device.  
- Optional **encrypted backup to Google Drive** (free tier).  
- **Biometric unlock** protects app access & exports.  
- Data export via `exportData(format)` → CSV/JSON → Android share intent.

---

## 🧩 Navigation Pattern
RootStack
├─ MainTabs (bottom tabs)
│ ├─ Today
│ ├─ Journal
│ ├─ Meds
│ └─ Profile
└─ AddBP (modal)

---

## 🪶 Development Rules
1. **TypeScript only**
2. Components follow atomic design: tokens → atoms → molecules → screens  
3. Use **async/await + Promises** for all SQLite calls  
4. No hardcoded colors — import from `tokens.ts`  
5. Keep screens pure; business logic lives in `/services`  
6. Follow naming conventions:  
   - Screens: `SomethingScreen.tsx`  
   - Hooks: `useSomething.ts`  
   - Components: `SomethingCard.tsx`  
7. Avoid paid APIs; use open-source or local storage only  
8. Every save → animated confirmation (toast / microanimation)

---

## 🧠 Assistant Context (for Gemini / AI Helpers)
**Goal:** Build and extend a local-first health tracker app for Gnaneswar Lopinti.  

### Focus areas:
- Build new screens & features incrementally (steps, workouts, journaling).  
- Maintain a **calm, minimal, data-driven** design.  
- Prioritize **offline privacy** (SQLite + local notifications).  
- Use **free, open-source packages** compatible with Expo.  
- Provide **ready-to-paste code**; keep snippets minimal and Expo-safe.  
- Never suggest commercial SDKs or cloud APIs that require payment.  

### Coding guidelines for assistants:
- Use imports from `src/theme/tokens.ts` for colors and spacing.  
- Assume **Expo SDK ≥ 51** and **React Native ≥ 0.76**.  
- Respect dark theme defaults.  
- Keep navigation consistent (RootStack + Tabs).  
- Use React hooks (`useEffect`, `useState`) — no class components.  
- Prefer local state or Context over Redux or heavy state libs.  
- Avoid breaking the offline-first principle.

---

## 🗓️ Roadmap

### Phase 1 (MVP)
- Today screen  
- BP tracking (add/view)  
- Medication reminders (local notifications)  
- Journal (daily log)  
- CSV/JSON export  
- Biometric lock  

### Phase 2
- Step tracking (Google Fit integration)  
- Workout tracker  
- Sleep logging  
- Trend charts  
- AI insights (pattern detection)

---

## ✅ Quick Setup

1. Clone or open the project.  
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the project
```
npm expo start
```