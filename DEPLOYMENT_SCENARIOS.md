# Scalable Deployment Scenarios & Architectural Traceability
**Project:** HealthPulseEDGE — Personal Health Companion (SIH 2026 / PS ID 26181 / Qualcomm Inc.)

---

## 1. Architectural Portability Proof

The edge inference engine ([`app/src/inference/OnDeviceInference.js`](file:///Users/reethika/Desktop/SIH_PROJECT/app/src/inference/OnDeviceInference.js)) is written in pure, vanilla JavaScript with zero UI framework dependencies:

```javascript
// Actual imports in app/src/inference/OnDeviceInference.js:
import { VITALS_MODEL_DATA, FALL_MODEL_DATA, SLEEP_MODEL_DATA, MODELS_METADATA } from './models_data.js';

// Zero React, zero DOM, zero UI dependencies.
// Executes pure mathematical matrix operations: Y = ReLU(X * W + B) and Softmax.
```

This ensures that the core AI reasoning and rule engines port directly across diverse platforms without requiring modifications to the inference logic.

---

## 2. Traceability Matrix: Deployment Scenarios

| Deployment Scenario | Target Hardware / Platform | Component Status | Exact Code Reference / Implementation Citation | Future Work / Porting Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **1. Smartphone App (Consumer & Patient)** | Android / iOS / Progressive Web App | **IMPLEMENTED** | [`app/src/App.jsx`](file:///Users/reethika/Desktop/SIH_PROJECT/app/src/App.jsx)<br/>[`app/src/inference/OnDeviceInference.js`](file:///Users/reethika/Desktop/SIH_PROJECT/app/src/inference/OnDeviceInference.js) | Production packaging with React Native / Capacitor for native App Store / Play Store distribution. |
| **2. Smartwatch / Fitness Band** | Qualcomm Snapdragon Wear / Wear OS | **IMPLEMENTED (Inference Core)** | [`models/exported/vitals_anomaly.tflite`](file:///Users/reethika/Desktop/SIH_PROJECT/models/exported/vitals_anomaly.tflite) (1.83 KB)<br/>[`models/exported/fall_detector.tflite`](file:///Users/reethika/Desktop/SIH_PROJECT/models/exported/fall_detector.tflite) (1.17 KB)<br/>[`models/exported/sleep_stage.tflite`](file:///Users/reethika/Desktop/SIH_PROJECT/models/exported/sleep_stage.tflite) (1.45 KB) | Build native Wear OS circular watchface UI shell; core inference engine ports 100% unchanged. |
| **3. Microcontroller Wearable Device** | ESP32-S3 / ARM Cortex-M4 Microcontroller | **IMPLEMENTED (Compact FlatBuffers)** | [`models/exported/models_metadata.json`](file:///Users/reethika/Desktop/SIH_PROJECT/models/exported/models_metadata.json)<br/>Exported FlatBuffers (<2 KB each) | **Roadmap:** Write C++ firmware driver using TensorFlow Lite for Microcontrollers (TFLM) to sample I2C sensors (MAX30102, MPU6050), apply post-training int8 quantization, and broadcast BLE GATT packets. |
| **4. Healthcare Provider / Clinical Review** | Primary Care Clinic / Hospital Desktop | **IMPLEMENTED (Device-Side Export)** | [`app/src/screens/SettingsScreen.jsx`](file:///Users/reethika/Desktop/SIH_PROJECT/app/src/screens/SettingsScreen.jsx#L28-L75)<br/>`handleExportDoctorSummary()` | **Roadmap:** Add optional FHIR/HL7 JSON export format for direct import into hospital Electronic Health Record (EHR) systems. |
| **5. Public Health / Disaster Response Agency** | District Disaster Management Authority (DDMA) | **ROADMAP (Not Built in Prototype)** | Concept defined in [`PROJECT_OVERVIEW.md`](file:///Users/reethika/Desktop/SIH_PROJECT/PROJECT_OVERVIEW.md#A1) | **Roadmap:** Opt-in, anonymized, differential-privacy telemetry aggregation to generate real-time heat strain and respiratory crisis regional heatmaps. |

---

## 3. Concrete Deployment Workflows

### Target 1: Smartphone (Consumer Application)
- **Status:** **Implemented & Verified**
- **Runtime:** Native browser / WebView running on Android & iOS.
- **Verification Evidence:** `npm run build` compiles clean bundle (`dist/index.html` + `dist/assets/`). Full 5-screen interface running live at `http://localhost:5173/`.

### Target 2: Smartwatch Companion (Wear OS / Snapdragon Wear)
- **Status:** **Inference Engine Implemented; Wearable Shell on Roadmap**
- **Runtime:** Qualcomm Snapdragon Wear NPU or Wear OS JavaScript engine.
- **Porting Effort:** The neural inference executor ([`OnDeviceInference.js`](file:///Users/reethika/Desktop/SIH_PROJECT/app/src/inference/OnDeviceInference.js)) and model weights require 0 lines of code change. Only the presentation layer needs adaptation for a 1.4-inch circular display.

### Target 3: Low-Power Embedded Sensor Node (ESP32-S3)
- **Status:** **Compact Float32 Binaries Ready; int8 Quantization & C++ Firmware on Roadmap**
- **Runtime:** TensorFlow Lite for Microcontrollers (TFLM).
- **Footprint:** Model A (1,872 bytes), Model B (1,200 bytes), Model C (1,488 bytes). Total flash footprint is ~4.5 KB in Float32, fitting comfortably in standard 4MB/8MB ESP32-S3 flash and consuming <4 KB SRAM. Int8 quantization is a planned optimization step for firmware flashing.

### Target 4: Healthcare Provider Clinical Handoff
- **Status:** **Implemented & Verified**
- **Mechanism:** Settings screen *"Export Summary for Doctor"* generates zero-cloud `.txt` clinical summaries containing rolling baseline shifts, current vital signs, and model anomaly classifications.
- **File Citation:** Function `handleExportDoctorSummary` in [`app/src/screens/SettingsScreen.jsx`](file:///Users/reethika/Desktop/SIH_PROJECT/app/src/screens/SettingsScreen.jsx).
