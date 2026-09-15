# Judge Demo Script — Personal Health Companion
**SIH 2026 | Problem Statement ID: 26181 | Sponsor: Qualcomm Inc.**
**Target Presentation Time:** 3 – 4 Minutes

---

## Pre-Demo Setup (15 Seconds)
1. Open the project root in terminal and start the application:
   ```bash
   cd /Users/reethika/Desktop/SIH_PROJECT/app
   npm run dev
   ```
2. Open the local URL in browser (`http://localhost:5173`).
3. Set browser window to mobile view or display directly in the sleek simulated smartphone viewport.

---

## Step 1: Live Vitals & Personal Rolling Baseline (45 Seconds)
- **What to show:**
  - Navigate to the **Vitals** tab.
  - Point out the streaming physiological cards: Heart Rate, SpO2, Skin Temp, Activity, and Sleep Quality.
  - Highlight the live real-time **PPG Arterial Pulse Waveform** canvas.
  - Point to the **7-Day Rolling Personal Baseline chips** (e.g. `Base: 72 BPM | +0`): explain that the system detects deviations from the *user's personal history* rather than rigid static generic medical cutoffs.
  - Point to the **Daily Wellness Indicator** (e.g., `92/100 - Excellent`) computed on-device from 5 sensor modalities.
  - Show the **Edge AI Badge** at the top right showing `<1ms` on-device inference latency.

---

## Step 2: Heat Wave Scenario & Disaster Alerts (45 Seconds)
- **What to show:**
  - In the **DATASET REPLAY SCENARIO** dropdown, select **"Heat Wave & Thermal Strain"**.
  - Show how live telemetry immediately reflects:
    - Ambient Temperature rising to `43.5°C`, Humidity `68%`, and Steadman Heat Index exceeding `50°C`.
    - User's physiological response: Skin Temp `38.4°C`, Heart Rate `118 BPM`, elevated EDA.
  - Show that **Model A** flags an anomaly (`High / Critical Risk`), and **Module 3 Heat-Wave Warning** fires with actionable recommendations (e.g., ORS hydration, move to shaded cool space).
  - Switch to the **Alerts** tab:
    - Toggle **"Vulnerable User Profile"** (Elderly / Chronic) $\rightarrow$ show that threshold sensitivities escalate faster to protect vulnerable demographics.
    - Switch cities (e.g., **Delhi**) to show real India AQI dataset data triggering respiratory alerts when PM2.5 spikes.

---

## Step 3: Simulated Fall Event & 10-Second Auto SOS (45 Seconds)
- **What to show:**
  - In the Scenario selector, pick **"Sudden Fall Impact (Geriatric)"** OR switch to the **SOS** tab and tap **"I NEED HELP — TRIGGER SOS"**.
  - Point to the **Model B (6-DOF IMU)** telemetry: acceleration spike to `4.8G` and angular tumble.
  - Show the **10-second visual & audible countdown** pulsing with urgent emergency rings.
  - **Demo Flow Option A (Cancellation):** Tap **"I'M OK — CANCEL SOS COUNTDOWN"** to show fail-safe false-alarm abort.
  - **Demo Flow Option B (Auto-Dispatch):** Allow timer to reach `00:00` $\rightarrow$ show simulated emergency SMS broadcast with mock GPS coordinates (`28.6139° N, 77.2090° E`), timestamp, and vital signs snapshot.

---

## Step 4: Prove Privacy & Offline Airplane Mode Claim (30 Seconds)
- **What to show:**
  - **Central Judging Differentiator:** Click the **Airplane Mode toggle** (or Wifi icon) in the header or in Settings.
  - The badge changes to **"OFFLINE MODE"**.
  - Show that all vitals monitoring, neural model inference, disaster alerts, and baseline tracking continue executing smoothly without interruption.
  - **Judges Takeaway:** Confirm that zero cloud API calls or telemetry payloads are transmitted.

---

## Step 5: Personal Wellness Dashboard (30 Seconds)
- **What to show:**
  - Navigate to the **Dashboard** tab.
  - Show the **7-Day Trend Bar Charts** for Heart Rate, SpO2, Temperature, Steps, and Sleep Quality.
  - Switch to **"Risk Gauges"** $\rightarrow$ show the 3 distinct gauges:
    1. *Heat Stress Risk*
    2. *Respiratory Hazard Risk*
    3. *Cardiovascular Risk*
  - Review the **Personalized Action Recommendations** panel and **Alert History Log** showing past resolved incidents.

---

## Step 6: Data Controls & Doctor Export (30 Seconds)
- **What to show:**
  - Navigate to the **Settings** tab.
  - Point to the **On-Device TFLite Model Manifest**: each model is verified quantized and `<2 KB` (far below the 5MB Snapdragon Wear ceiling).
  - Tap **"Export Summary for Doctor (Local File)"** $\rightarrow$ downloads an instant local clinical text report with 0 network calls.
  - Point to the **"Delete My Data"** button $\rightarrow$ instant local storage wipe and rolling baseline reset.

---

## Key Pitch Talking Points for Judges
1. **True Edge AI:** 3 quantized models trained on gold-standard datasets (WESAD, Geriatric Fall, Sleep-EDF, India AQI, PTT PPG) running at `<0.3ms` latency.
2. **Disaster Resilience for India:** Combines environmental hazards (AQI, Heat Index, Floods) with personal vitals to protect vulnerable populations.
3. **Hardware Ready:** Modular architecture portable to Qualcomm Snapdragon Wear smartwatches, edge phones, and relief center dashboards.
