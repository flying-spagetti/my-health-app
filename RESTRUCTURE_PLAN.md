# App Restructure Plan

## Overview
Transforming the health tracking app from a clinical dark-themed interface to a warm, organic, wellness-focused aesthetic while maintaining equal prominence for both health and wellness features.

---

## Phase 1: Foundation (Design System)

### 1.1 Update Theme Tokens (`constants/theme.ts`)
- [ ] Replace color palette with design.json colors
- [ ] Add new background colors (lavender, sage, cream)
- [ ] Update typography scale
- [ ] Add handwritten font family references
- [ ] Update spacing and border radius tokens
- [ ] Add soft shadow definitions

### 1.2 Add Custom Fonts
- [ ] Install expo-font dependencies
- [ ] Download and add Caveat font (display/handwritten)
- [ ] Download and add Nunito font (body)
- [ ] Create font loading hook
- [ ] Update App entry to load fonts

---

## Phase 2: Navigation Restructure

### Current Structure (4 tabs):
```
Today | Journal | Trackers | Profile
```

### New Structure (5 tabs):
```
Home | Mood | Wellness | Health | Profile
```

### Tab Details:

#### 🏠 Home (Dashboard)
Mixed content showing:
- Welcome header with avatar
- Quick mood indicator (today's mood)
- Mood history calendar (7-day dots)
- Today's due items (meds, appointments)
- Stress/energy level mini-chart
- Activity summary
- Quick action buttons

#### 😊 Mood (Journal/Mood)
- Mood calendar visualization (full month)
- Mood trends and insights
- Journal entries list
- Quick mood check-in button
- Mood history graphs

#### 🧘 Wellness
- Meditation routines
- Meditation history
- Practice categories
- Session logging
- Breathing exercises (future)
- Sleep tracking (future)

#### ❤️ Health
- Blood pressure tracking
- Medications management
- Supplements tracking
- Migraine tracking
- Appointments
- Health metrics/vitals

#### 👤 Profile
- User settings
- Theme preferences
- Data export
- App info
- Coming soon features

---

## Phase 3: New Components

### 3.1 Core Design Components
- [ ] `Card.tsx` - Soft floating card with rounded corners
- [ ] `SectionHeader.tsx` - Handwritten style headers
- [ ] `CTAButton.tsx` - Pill-shaped dark buttons
- [ ] `MoodChip.tsx` - Selectable mood pills
- [ ] `Avatar.tsx` - User profile avatar

### 3.2 Mood Components
- [ ] `MoodCalendar.tsx` - Weekly/monthly mood dots
- [ ] `MoodTrends.tsx` - Insights and graphs
- [ ] `MoodCheckIn.tsx` - Quick mood entry flow
- [ ] `StressChart.tsx` - Stress level visualization

### 3.3 Dashboard Components
- [ ] `WelcomeHeader.tsx` - Avatar + greeting + notification
- [ ] `QuickMoodCard.tsx` - Today's mood summary
- [ ] `DueItemsCard.tsx` - Today's tasks
- [ ] `RecommendationCard.tsx` - Smart suggestions
- [ ] `ActivitySummary.tsx` - Steps/exercise summary

### 3.4 Wellness Components
- [ ] `MeditationCard.tsx` - Featured meditation
- [ ] `PracticeListItem.tsx` - Practice category row
- [ ] `MeditationHistory.tsx` - Past sessions
- [ ] `ProgressRing.tsx` - Circular progress (exists, needs update)

### 3.5 Health Components
- [ ] `HealthMetricCard.tsx` - BP, vitals display
- [ ] `MedicationCard.tsx` - Medication item
- [ ] `TrackerCard.tsx` - Generic tracker card
- [ ] `HistoryItem.tsx` - History list item

### 3.6 Illustration Components
- [ ] `Illustration.tsx` - Wrapper for illustrations
- [ ] Add placeholder SVGs/images from free libraries

---

## Phase 4: Screen Redesigns

### 4.1 Home Screen (`app/(tabs)/index.tsx`)
```
┌─────────────────────────────────┐
│ 👤 Welcome back, User      🔔  │ ← Welcome Header
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Mood history        Week ▼  │ │
│ │ M  T  W  T  F  S  S        │ │ ← Mood Calendar Card
│ │ 🔵 🔵 🔵 🔵 🟠 🟠 🟠        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌──────────┐ ┌──────────────┐  │
│ │ Stress   │ │ Health diary │  │ ← 2-column grid
│ │ 📈       │ │ ⬤⬤⬤⬤⬤⬤⬤  │  │
│ └──────────┘ └──────────────┘  │
├─────────────────────────────────┤
│ Due Today                       │
│ ┌─────────────────────────────┐ │
│ │ 💊 Medication A      ✓     │ │ ← Due Items
│ │ 🧘 Morning Meditation ✓     │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🏃 Today's Activity         │ │ ← Activity Summary
│ │ 2,450 steps • 15 min active │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 4.2 Mood Screen (`app/(tabs)/mood.tsx`) - NEW
```
┌─────────────────────────────────┐
│ Mood & Journal                  │ ← Header
│ Track your emotional wellbeing  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │      January 2026           │ │
│ │ M  T  W  T  F  S  S        │ │ ← Full Month Calendar
│ │ 🔵 🔵 🔵 🔵 🔵 🔵 🔵        │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Insights                        │ ← Mood Trends
│ ┌─────────────────────────────┐ │
│ │ 📊 Your mood has been       │ │
│ │ mostly positive this week!  │ │
│ │ Average: 7.2/10             │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Recent Entries                  │
│ ┌─────────────────────────────┐ │
│ │ Today • Joyful 😊           │ │ ← Journal entries
│ │ Energy: 8 • Stress: 3       │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │     Add Journal Entry       │ │ ← CTA Button
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 4.3 Wellness Screen (`app/(tabs)/wellness.tsx`) - NEW
```
┌─────────────────────────────────┐
│ ← Wellness                   ⋮  │
├─────────────────────────────────┤
│ Try today                       │ ← Handwritten header
│ ┌─────────────────────────────┐ │
│ │ 🧘 Morning meditation       │ │
│ │ Start your day with calm    │ │ ← Featured Card
│ │ 10 minutes                  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Practices                       │
│ ┌─────────────────────────────┐ │
│ │ Better sleep           →   │ │
│ │ For anxiety            →   │ │ ← Practice List
│ │ Morning meditations    →   │ │
│ │ Mindfulness            →   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Meditation history              │
│ ┌─────────────────────────────┐ │
│ │ 🌸 Morning meditation       │ │
│ │    12.05.24                 │ │ ← History Items
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │     Log Meditation          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 4.4 Health Screen (`app/(tabs)/health.tsx`) - RENAMED from meds.tsx
```
┌─────────────────────────────────┐
│ Health Tracking                 │
│ Manage your health data         │
├─────────────────────────────────┤
│ ┌──────────┐ ┌──────────────┐  │
│ │ ❤️ BP    │ │ 💊 Meds     │  │
│ │ 120/80   │ │ 3 active    │  │ ← Quick Stats Grid
│ └──────────┘ └──────────────┘  │
│ ┌──────────┐ ┌──────────────┐  │
│ │ ⚡ Migraine│ │ 📅 Appts   │  │
│ │ 2 this mo│ │ 1 upcoming  │  │
│ └──────────┘ └──────────────┘  │
├─────────────────────────────────┤
│ Medications                     │
│ ┌─────────────────────────────┐ │
│ │ 💊 Medication A             │ │
│ │ 10mg daily                  │ │ ← Medication Cards
│ └─────────────────────────────┘ │
│ + Add Medication                │
├─────────────────────────────────┤
│ Supplements                     │
│ ┌─────────────────────────────┐ │
│ │ 🌿 Vitamin D               │ │
│ │ 1000 IU                     │ │
│ └─────────────────────────────┘ │
│ + Add Supplement                │
├─────────────────────────────────┤
│ Quick Actions                   │
│ ┌──────────┐ ┌──────────────┐  │
│ │ Log BP   │ │ Log Migraine │  │
│ └──────────┘ └──────────────┘  │
└─────────────────────────────────┘
```

---

## Phase 5: Color Scheme Application

### Background Colors by Screen:
| Screen | Background |
|--------|------------|
| Home | Lavender (#C5BFDC) |
| Mood | Sage (#B8D4B4) |
| Wellness | Cream (#F7F6F2) |
| Health | Lavender (#C5BFDC) |
| Profile | Cream (#F7F6F2) |
| Forms/Modals | White (#FFFFFF) |

### Card Styling:
- Background: White (#FFFFFF)
- Border Radius: 20px
- Shadow: 0 4px 12px rgba(0,0,0,0.06)
- Padding: 16px

---

## Phase 6: Database Changes (None Required)
The existing database schema supports all planned features. No migrations needed.

---

## Phase 7: Illustrations

### Free Illustration Libraries to Use:
1. **Undraw** - https://undraw.co (SVG illustrations)
2. **Humaaans** - https://humaaans.com (customizable people)
3. **Open Peeps** - https://openpeeps.com (hand-drawn people)
4. **Blush** - https://blush.design (various styles)

### Illustration Placements:
- Empty states (no entries, no medications)
- Mood check-in character
- Meditation featured card
- Onboarding (future)
- Achievement celebrations (future)

---

## Implementation Order

### Week 1: Foundation
1. ✅ Create design.json
2. Update theme.ts
3. Add custom fonts
4. Create base components (Card, Button, SectionHeader)

### Week 2: Navigation & Core Screens
5. Restructure tab navigation
6. Create new tab files (mood.tsx, wellness.tsx, health.tsx)
7. Redesign home dashboard

### Week 3: Mood Features
8. Create MoodCalendar component
9. Create MoodTrends component
10. Integrate with journal data

### Week 4: Polish & Illustrations
11. Update all remaining screens
12. Add illustrations
13. Test and refine

---

## Files to Create:
```
app/(tabs)/mood.tsx          # NEW - Mood/Journal tab
app/(tabs)/wellness.tsx      # NEW - Wellness tab
app/(tabs)/health.tsx        # RENAME from meds.tsx

components/design/
  Card.tsx
  SectionHeader.tsx
  CTAButton.tsx
  WelcomeHeader.tsx
  Avatar.tsx

components/mood/
  MoodCalendar.tsx
  MoodTrends.tsx
  MoodChip.tsx

components/wellness/
  MeditationCard.tsx
  PracticeListItem.tsx

components/health/
  HealthMetricCard.tsx
  MedicationCard.tsx

components/illustrations/
  Illustration.tsx
  (SVG assets)

hooks/
  use-fonts.ts              # Font loading hook
```

## Files to Modify:
```
constants/theme.ts          # Complete overhaul
app/(tabs)/_layout.tsx      # Add new tabs
app/(tabs)/index.tsx        # Redesign dashboard
app/(tabs)/journal.tsx      # → Move to mood.tsx
app/(tabs)/meds.tsx         # → Rename to health.tsx
app/(tabs)/profile.tsx      # Style updates
app/_layout.tsx             # Font loading
```

---

## Notes
- All changes follow the design.json specification
- Equal prominence for health and wellness features
- Warm, organic aesthetic throughout
- Functionality additions (recommendations, etc.) planned for later phases
