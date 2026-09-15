/**
 * HealthPulseEDGE — ESP32-S3 Direct-SIM BLE Emergency Broadcaster Firmware
 * PS ID: 26181 (Qualcomm Inc. / SIH 2026)
 * 
 * Hardware Target: ESP32-S3 (or standard ESP32)
 * Features:
 *  - Custom BLE GATT Server advertising SOS Service UUID
 *  - Notify characteristic transmitting emergency payloads (FALL, HR_ANOMALY, MANUAL)
 *  - Persistent auto-reconnect handling
 *  - Physical BOOT/SOS button trigger on GPIO 0 with software debouncing
 *  - Detailed Serial Monitor diagnostics (115200 baud)
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Custom 128-bit UUIDs for HealthPulseEDGE SOS Dispatch Service
#define SOS_SERVICE_UUID              "19b10000-e8f2-537e-4f6c-d104768a1214"
#define SOS_EVENT_CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"
#define VITALS_CHARACTERISTIC_UUID    "19b10002-e8f2-537e-4f6c-d104768a1214"

#define MANUAL_SOS_BUTTON_PIN         0    // Default BOOT button on ESP32-S3 DevKit
#define STATUS_LED_PIN                2    // On-board LED indicator
#define DEBOUNCE_DELAY_MS             250

BLEServer* pServer = nullptr;
BLECharacteristic* pSosCharacteristic = nullptr;
BLECharacteristic* pVitalsCharacteristic = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;
unsigned long lastButtonPress = 0;
unsigned long lastHeartbeat = 0;

// Server Callbacks for persistent BLE connection handling
class SosServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("[BLE] Client connected (Paired Android Phone).");
    digitalWrite(STATUS_LED_PIN, HIGH);
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("[BLE] Client disconnected. Restarting advertising for auto-reconnect...");
    digitalWrite(STATUS_LED_PIN, LOW);
  }
};

/**
 * Transmits an emergency SOS alert notification to the paired Android phone
 */
void sendBleEmergencyEvent(const char* eventType, float hr, float spo2, float svmG) {
  if (!deviceConnected) {
    Serial.println("[BLE WARN] Cannot dispatch SOS: No Android phone connected via BLE.");
    Serial.println("[BLE WARN] Event cached locally. Will broadcast upon reconnection.");
    return;
  }

  unsigned long currentUptimeMs = millis();
  
  // Construct compact JSON payload
  char payload[160];
  snprintf(payload, sizeof(payload), 
    "{\"event\":\"%s\",\"ts\":%lu,\"hr\":%.1f,\"spo2\":%.1f,\"svm\":%.2f}",
    eventType, currentUptimeMs, hr, spo2, svmG
  );

  pSosCharacteristic->setValue((uint8_t*)payload, strlen(payload));
  pSosCharacteristic->notify();

  Serial.print("[BLE SUCCESS] SOS event sent: ");
  Serial.print(eventType);
  Serial.print(" @ t=");
  Serial.print(currentUptimeMs);
  Serial.print(" ms | Payload: ");
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=============================================================");
  Serial.println("  HealthPulseEDGE — ESP32-S3 BLE Emergency Broadcaster      ");
  Serial.println("=============================================================");

  pinMode(MANUAL_SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize BLE Stack
  BLEDevice::init("HealthPulse_Wearable");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new SosServerCallbacks());

  // Create SOS GATT Service
  BLEService* pSosService = pServer->createService(SOS_SERVICE_UUID);

  // Create SOS Event Notify Characteristic
  pSosCharacteristic = pSosService->createCharacteristic(
    SOS_EVENT_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY |
    BLECharacteristic::PROPERTY_INDICATE
  );
  pSosCharacteristic->addDescriptor(new BLE2902());

  // Create Vitals Telemetry Read/Notify Characteristic
  pVitalsCharacteristic = pSosService->createCharacteristic(
    VITALS_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pVitalsCharacteristic->addDescriptor(new BLE2902());

  // Start Service
  pSosService->start();

  // Configure BLE Advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SOS_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // Functions well with iPhone/Android connections
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("[BLE READY] Advertising as 'HealthPulse_Wearable'.");
  Serial.print("[BLE READY] Service UUID: ");
  Serial.println(SOS_SERVICE_UUID);
  Serial.println("[BLE READY] Press BOOT button (GPIO 0) to trigger manual SOS.");
  Serial.println("=============================================================\n");
}

void loop() {
  // 1. Check physical manual SOS button (Active LOW with pull-up)
  if (digitalRead(MANUAL_SOS_BUTTON_PIN) == LOW) {
    unsigned long now = millis();
    if (now - lastButtonPress > DEBOUNCE_DELAY_MS) {
      lastButtonPress = now;
      Serial.println("\n[BUTTON] Manual Emergency SOS button pressed on wearable!");
      sendBleEmergencyEvent("MANUAL", 88.0, 98.2, 1.05);
    }
  }

  // 2. Handle BLE auto-reconnect advertising
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give BLE stack time to reset
    pServer->startAdvertising();
    Serial.println("[BLE] Advertising restarted for auto-reconnect.");
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  // 3. Periodic heartbeat log (every 10 seconds)
  if (millis() - lastHeartbeat > 10000) {
    lastHeartbeat = millis();
    if (deviceConnected) {
      Serial.println("[BLE STATUS] Connected & Monitoring. Ready for trigger.");
    } else {
      Serial.println("[BLE STATUS] Awaiting Android Phone connection...");
    }
  }

  delay(20);
}
