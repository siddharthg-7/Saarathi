# Design System: Saarathi & Kairo

This design system establishes the visual language, typography scales, color tokens, and component guidelines for **Saarathi**, ensuring a cohesive and premium experience across **React Native (Expo)** and **Vite + React (Web)**.

The aesthetic follows a dark-mode-first, minimalist philosophy inspired by Linear, Notion, Raycast, and Arc Browser.

---

## 1. Color Palette & Design Tokens

The color system relies on deep slate foundations accented by vibrant neon/indigo highlights for AI interactions and amber/coral warnings for machine learning telemetry alerts.

### Neutral Surfaces & Backgrounds

* **Background Deep (`bg-950`):** `#0B0F19` — Primary screen canvas for web and mobile.
* **Surface Card (`bg-900`):** `#111827` — Cards, modals, and container backdrops.
* **Elevated Surface (`bg-800`):** `#1F2937` — Hover states, dropdowns, and active elements.
* **Border Subdued:** `rgba(255, 255, 255, 0.08)` — Subtle card borders.
* **Border Active:** `rgba(99, 102, 241, 0.4)` — Focused inputs and active indicators.

### Brand & Functional Accents

* **Electric Indigo (`indigo-500`):** `#6366F1` — Primary brand color, Kairo AI accents, and primary action buttons.
* **Emerald Green (`emerald-500`):** `#10B981` — Task completion success states, positive streaks, and habit momentum rings.
* **Amber Warning (`amber-500`):** `#F59E0B` — Medium procrastination risk and energy warnings.
* **Coral Alert (`rose-500`):** `#EF4444` — High skip-probability alerts (`>80%`) and burnout warnings.

### Typography Colors

* **Text Primary:** `#F9FAFB` (`gray-50`) — Main headers and important text.
* **Text Secondary:** `#9CA3AF` (`gray-400`) — Subtitles, metadata, and timestamps.
* **Text Muted:** `#6B7280` (`gray-500`) — Placeholders and disabled states.

---

## 2. Typography & Scale

The type scale uses clean, modern sans-serif fonts (**Inter** on web, **SF Pro / system fonts** on mobile) designed for dense data readability.

| Style Name | Font Size (Web / RN) | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| **Display / Hero** | `32px` / `32` | Bold (700) | `40px` | Landing page titles & major greetings |
| **H1** | `24px` / `24` | Semi-bold (600) | `32px` | Screen titles & section headers |
| **H2** | `18px` / `18` | Medium (500) | `24px` | Card headers & sub-sections |
| **Body Large** | `16px` / `16` | Regular (400) | `24px` | Main conversational text & Kairo chat |
| **Body Base** | `14px` / `14` | Regular (400) | `20px` | Standard task titles & descriptions |
| **Caption / Meta** | `12px` / `12` | Medium (500) | `16px` | Timestamps, tags, metadata, badges |

---

## 3. UI Component Specifications

### A. Glassmorphism Cards

* **Web CSS:** `background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;`
* **React Native / NativeWind:** `bg-gray-900/70 border border-white/10 rounded-xl`
* **Usage:** Task cards, Kairo insight panels, and analytics containers.

### B. Buttons & Interactive States

* **Primary Button (Action / Auth):**
* Background: `indigo-500` (Hover: `indigo-600`)
* Text: White, Medium weight
* Border Radius: `8px` (`rounded-lg`)
* Shadow: `0 4px 14px rgba(99, 102, 241, 0.3)`


* **Secondary / Outline Button:**
* Background: Transparent (`bg-transparent`)
* Border: `1px solid rgba(255, 255, 255, 0.15)`
* Text: `gray-200`



### C. ML Procrastination & Risk Badges

* **Low Risk (<30%):** Green badge (`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`)
* **Medium Risk (30–75%):** Amber badge (`bg-amber-500/10 text-amber-400 border border-amber-500/20`)
* **High Skip Risk (>75%):** Coral badge (`bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse`)

---

## 4. Layout & Spacing System

Saarathi uses an 8px base grid system for predictable spatial rhythm:

* **Spacing 1:** `4px` (`space-1`)
* **Spacing 2:** `8px` (`space-2`)
* **Spacing 4:** `16px` (`space-4` — Standard padding)
* **Spacing 6:** `24px` (`space-6` — Section padding)
* **Spacing 8:** `32px` (`space-8` — Major layout gaps)

---

## 5. Motion & Micro-Interactions

* **Page Transitions:** Fade and subtle slide-up using `react-native-reanimated` (Mobile) and Tailwind transition utilities (Web).
* **Voice Recording Animation:** Real-time audio waveform visualization powered by Skia and Reanimated during Brain Dump mode.
* **Haptic Feedback:** Subtle native haptics on mobile when checking off tasks or triggering Kairo voice commands.