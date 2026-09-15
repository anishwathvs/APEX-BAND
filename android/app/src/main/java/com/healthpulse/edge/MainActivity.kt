package com.healthpulse.edge

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.healthpulse.edge.ble.BleSosManager
import com.healthpulse.edge.contacts.EmergencyContactsRepository
import com.healthpulse.edge.sms.DirectSimSmsDispatcher

/**
 * HealthPulseEDGE Native Android Activity
 * Coordinates runtime permissions, BLE listener, and Direct-SIM emergency dispatch.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var bleSosManager: BleSosManager
    private lateinit var smsDispatcher: DirectSimSmsDispatcher
    private lateinit var contactsRepository: EmergencyContactsRepository

    private val requiredPermissions by lazy {
        val list = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            list.add(Manifest.permission.BLUETOOTH_SCAN)
            list.add(Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            list.add(Manifest.permission.BLUETOOTH)
            list.add(Manifest.permission.BLUETOOTH_ADMIN)
        }
        list.toTypedArray()
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.SEND_SMS] == true
        val bleGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions[Manifest.permission.BLUETOOTH_SCAN] == true && permissions[Manifest.permission.BLUETOOTH_CONNECT] == true
        } else {
            true
        }

        if (smsGranted && bleGranted) {
            Log.i("MainActivity", "[PERMISSIONS] All required runtime permissions granted.")
            startBleSosListener()
        } else {
            Toast.makeText(this, "SEND_SMS and BLE permissions required for Direct-SIM SOS.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        contactsRepository = EmergencyContactsRepository(this)
        smsDispatcher = DirectSimSmsDispatcher(this)

        bleSosManager = BleSosManager(this) { eventType, hr, spo2, svmG ->
            handleIncomingBleEmergency(eventType, hr, spo2, svmG)
        }

        checkAndRequestPermissions()
    }

    private fun checkAndRequestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            Log.i("MainActivity", "[PERMISSIONS] Requesting runtime permissions: $missing")
            permissionLauncher.launch(missing.toTypedArray())
        } else {
            startBleSosListener()
        }
    }

    private fun startBleSosListener() {
        Log.i("MainActivity", "[BLE INIT] Starting BLE peripheral scan for HealthPulse Wearable...")
        bleSosManager.startScanning()
    }

    private fun handleIncomingBleEmergency(eventType: String, hr: Float, spo2: Float, svmG: Float) {
        Log.i("MainActivity", "[EMERGENCY TRIGGERED] Event: $eventType | HR: $hr | SpO2: $spo2 | SVM: $svmG")
        
        val contacts = contactsRepository.getContacts()
        
        // Automatic silent background dispatch via phone's physical SIM card
        smsDispatcher.dispatchEmergencyAlert(
            eventType = eventType,
            hr = hr,
            spo2 = spo2,
            svmG = svmG,
            location = null, // Location fetched via FusedLocationClient in production
            contacts = contacts,
            callback = object : DirectSimSmsDispatcher.DispatchCallback {
                override fun onStatusChanged(status: DirectSimSmsDispatcher.DispatchStatus, details: String) {
                    Log.i("MainActivity", "[DISPATCH STATUS] $status: $details")
                }
            }
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        bleSosManager.disconnect()
    }
}
