package com.healthpulse.edge.ble

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import org.json.JSONObject
import java.util.UUID

/**
 * BLE Central Manager for HealthPulseEDGE
 * Connects to ESP32-S3 Wearable, listens for SOS notifications, and delegates to DirectSimSmsDispatcher.
 */
@SuppressLint("MissingPermission")
class BleSosManager(
    private val context: Context,
    private val onEmergencyEventReceived: (eventType: String, hr: Float, spo2: Float, svmG: Float) -> Unit
) {

    companion object {
        private const val TAG = "BleSosManager"
        val SOS_SERVICE_UUID: UUID = UUID.fromString("19b10000-e8f2-537e-4f6c-d104768a1214")
        val SOS_EVENT_CHARACTERISTIC_UUID: UUID = UUID.fromString("19b10001-e8f2-537e-4f6c-d104768a1214")
        val CLIENT_CHARACTERISTIC_CONFIG_DESCRIPTOR_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
    }

    private val bluetoothManager: BluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
    private var bluetoothGatt: BluetoothGatt? = null
    private var isScanning = false
    private val handler = Handler(Looper.getMainLooper())

    enum class ConnectionState {
        DISCONNECTED,
        SCANNING,
        CONNECTING,
        CONNECTED
    }

    var connectionState: ConnectionState = ConnectionState.DISCONNECTED
        private set

    fun startScanning() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            Log.e(TAG, "[BLE ERROR] Bluetooth adapter is disabled or unavailable.")
            return
        }

        val scanner = bluetoothAdapter.bluetoothLeScanner
        if (scanner == null) {
            Log.e(TAG, "[BLE ERROR] BluetoothLeScanner is null.")
            return
        }

        val filter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid(SOS_SERVICE_UUID))
            .build()

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        connectionState = ConnectionState.SCANNING
        isScanning = true
        Log.i(TAG, "[BLE SCAN] Starting BLE scan for Service UUID: $SOS_SERVICE_UUID")
        scanner.startScan(listOf(filter), settings, scanCallback)
    }

    fun stopScanning() {
        if (isScanning && bluetoothAdapter?.isEnabled == true) {
            bluetoothAdapter.bluetoothLeScanner?.stopScan(scanCallback)
            isScanning = false
            Log.i(TAG, "[BLE SCAN] Stopped BLE scan.")
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            result?.device?.let { device ->
                Log.i(TAG, "[BLE FOUND] Discovered target wearable: ${device.name ?: "Unknown"} (${device.address})")
                stopScanning()
                connectToDevice(device)
            }
        }

        override fun onScanFailed(errorCode: Int) {
            Log.e(TAG, "[BLE ERROR] Scan failed with error code: $errorCode")
            connectionState = ConnectionState.DISCONNECTED
        }
    }

    private fun connectToDevice(device: BluetoothDevice) {
        connectionState = ConnectionState.CONNECTING
        Log.i(TAG, "[BLE CONNECT] Connecting GATT to ${device.address}...")
        bluetoothGatt = device.connectGatt(context, true, gattCallback) // autoConnect = true for persistent reconnect
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt?, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                connectionState = ConnectionState.CONNECTED
                Log.i(TAG, "[BLE CONNECTED] GATT connected to wearable. Discovering services...")
                gatt?.discoverServices()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                connectionState = ConnectionState.DISCONNECTED
                Log.w(TAG, "[BLE DISCONNECTED] GATT connection lost. Will auto-reconnect when device in range.")
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                val service = gatt?.getService(SOS_SERVICE_UUID)
                val characteristic = service?.getCharacteristic(SOS_EVENT_CHARACTERISTIC_UUID)
                if (characteristic != null) {
                    gatt.setCharacteristicNotification(characteristic, true)
                    val descriptor = characteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_DESCRIPTOR_UUID)
                    descriptor?.let {
                        it.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                        gatt.writeDescriptor(it)
                        Log.i(TAG, "[BLE READY] Subscribed to SOS Emergency notifications from wearable.")
                    }
                }
            }
        }

        override fun onCharacteristicChanged(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?) {
            if (characteristic?.uuid == SOS_EVENT_CHARACTERISTIC_UUID) {
                val rawBytes = characteristic.value
                val payloadString = String(rawBytes)
                Log.i(TAG, "[BLE NOTIFICATION RECEIVED] Payload: $payloadString")

                try {
                    val json = JSONObject(payloadString)
                    val event = json.optString("event", "FALL")
                    val hr = json.optDouble("hr", 72.0).toFloat()
                    val spo2 = json.optDouble("spo2", 98.0).toFloat()
                    val svm = json.optDouble("svm", 4.8).toFloat()

                    handler.post {
                        onEmergencyEventReceived(event, hr, spo2, svm)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "[BLE ERROR] Failed to parse SOS payload JSON: ${e.message}")
                    handler.post {
                        onEmergencyEventReceived("MANUAL", 72.0f, 98.0f, 1.0f)
                    }
                }
            }
        }
    }

    fun disconnect() {
        bluetoothGatt?.disconnect()
        bluetoothGatt?.close()
        bluetoothGatt = null
        connectionState = ConnectionState.DISCONNECTED
    }
}
