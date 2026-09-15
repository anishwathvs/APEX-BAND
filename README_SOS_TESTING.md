# Direct-SIM SOS Dispatch: End-to-End Testing Guide
**Architecture:** ESP32-S3 Wearable $\rightarrow$ Bluetooth Low Energy (BLE) $\rightarrow$ Paired Android Phone $\rightarrow$ Native `SmsManager` (Direct-SIM)

---

## 1. Architectural Blueprint (Zero Cloud, Direct-SIM Only)

```
┌─────────────────────────┐          BLE GATT Notification          ┌───────────────────────────┐
│     ESP32-S3 Wearable   │ ──────────────────────────────────────► │    Paired Android Phone   │
│  - Fall Shock / Anomaly │   UUID: 19b10001-e8f2-537e-4f6c...      │  - BleSosManager Listener │
│  - Physical BOOT Button │                                         │  - DirectSimSmsDispatcher │
└─────────────────────────┘                                         └─────────────┬─────────────┘
                                                                                  │
                                                            Native SmsManager     │ Zero Cloud / Zero Server
                                                            sendTextMessage()     │ Physical Handset SIM Card
                                                                                  ▼
                                                                    ┌───────────────────────────┐
                                                                    │   Carrier Cell Towers     │
                                                                    │   (Offline Emergency Leg) │
                                                                    └─────────────┬─────────────┘
                                                                                  │
                                                                                  ▼
                                                                    ┌───────────────────────────┐
                                                                    │  Emergency Contact Phone  │
                                                                    │  (Dr. Sharma / Relatives) │
                                                                    └───────────────────────────┘
```

---

## 2. Part 1: ESP32-S3 Firmware Setup & Testing

### Hardware Requirements
- **Microcontroller:** ESP32-S3 DevKit (or standard ESP32 / ESP32-C3)
- **Pinout:** 
  - GPIO 0: Physical Manual BOOT/SOS Button (active-low with pullup)
  - GPIO 2: Status LED

### Flashing via Arduino IDE
1. Open [`firmware/esp32_s3_ble_sos/esp32_s3_ble_sos.ino`](file:///Users/reethika/Desktop/SIH_PROJECT/firmware/esp32_s3_ble_sos/esp32_s3_ble_sos.ino).
2. Select Board: **ESP32S3 Dev Module** (or **ESP32 Dev Module**).
3. Upload firmware.
4. Open **Serial Monitor** at **115200 baud**.
5. Observe boot output:
   ```
   [BLE READY] Advertising as 'HealthPulse_Wearable'.
   [BLE READY] Service UUID: 19b10000-e8f2-537e-4f6c-d104768a1214
   [BLE READY] Press BOOT button (GPIO 0) to trigger manual SOS.
   ```
6. Press the physical BOOT button on the ESP32-S3 board. Observe Serial output:
   ```
   [BUTTON] Manual Emergency SOS button pressed on wearable!
   [BLE SUCCESS] SOS event sent: MANUAL @ t=12400 ms | Payload: {"event":"MANUAL","ts":12400,"hr":88.0,"spo2":98.2,"svm":1.05}
   ```

---

## 3. Part 2: Android App Testing & Native SIM Dispatch

### Native Android Project Structure
- [`android/app/src/main/AndroidManifest.xml`](file:///Users/reethika/Desktop/SIH_PROJECT/android/app/src/main/AndroidManifest.xml): Declares `SEND_SMS`, `ACCESS_FINE_LOCATION`, and `BLUETOOTH_CONNECT`.
- [`android/app/src/main/java/com/healthpulse/edge/ble/BleSosManager.kt`](file:///Users/reethika/Desktop/SIH_PROJECT/android/app/src/main/java/com/healthpulse/edge/ble/BleSosManager.kt): Scans for `SOS_SERVICE_UUID`, connects, auto-reconnects, and handles notifications.
- [`android/app/src/main/java/com/healthpulse/edge/sms/DirectSimSmsDispatcher.kt`](file:///Users/reethika/Desktop/SIH_PROJECT/android/app/src/main/java/com/healthpulse/edge/sms/DirectSimSmsDispatcher.kt): Formats message payload and invokes `SmsManager.getDefault().sendTextMessage(...)` with `PendingIntent` delivery tracking.
- [`android/app/src/main/java/com/healthpulse/edge/contacts/EmergencyContactsRepository.kt`](file:///Users/reethika/Desktop/SIH_PROJECT/android/app/src/main/java/com/healthpulse/edge/contacts/EmergencyContactsRepository.kt): Manages 1–3 contacts in local private `SharedPreferences`.

### Step-by-Step Testing
1. Install and launch the Android APK on a physical Android phone with an active SIM card.
2. Grant runtime permissions when prompted (**SMS**, **Location**, **Nearby Devices**).
3. Power on the ESP32-S3 wearable board.
4. The Android app automatically discovers and connects to `'HealthPulse_Wearable'`.
5. Press the physical button on the ESP32-S3 (or trigger fall detection).
6. **Automatic Direct-SIM Dispatch:**
   - The phone's native `SmsManager` transmits the alert SMS directly via the handset's SIM card without requiring user interaction.
   - The on-screen preview card immediately updates: `SENDING` $\rightarrow$ `SENT` $\rightarrow$ `DELIVERED`.
7. **Verification:** Confirm receipt of the incoming SMS on the emergency recipient test handset:
   ```
   🚨 EMERGENCY HEALTH ALERT (MANUAL Detected)
   Patient: User (HealthPulse Companion)
   Time: 12:08:45 PM
   Location: 13.0827° N, 80.2707° E (±12m)
   Vitals Snapshot: HR 88 BPM | SpO2 98.2% | Motion SVM: 1.05g
   Automated Edge-AI Alert via Direct-SIM HealthPulseEDGE.
   ```
8. **Visible Fallback:** If SMS permission is restricted or carrier transmission fails, tap the **"Resend via SMS App"** button to pre-fill the native SMS app via the `sms:` deep link.

---

## 4. Browser / Web Bluetooth Testing

1. Open `http://localhost:5173/` in Google Chrome on Android or Desktop.
2. Navigate to the **SOS Screen**.
3. Click **"Pair Wearable"** in the top BLE banner.
4. Select `'HealthPulse_Wearable'` in the browser Bluetooth dialog.
5. Press the physical button on the ESP32-S3: the app automatically receives the event, begins the 10-second countdown, and dispatches the Direct-SIM emergency payload preview.
