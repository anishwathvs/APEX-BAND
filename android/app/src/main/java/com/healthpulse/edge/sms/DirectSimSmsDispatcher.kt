package com.healthpulse.edge.sms

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.telephony.SmsManager
import android.util.Log
import com.healthpulse.edge.contacts.EmergencyContact
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Direct-SIM SMS Dispatcher for HealthPulseEDGE
 * 
 * Non-negotiable Constraint:
 * Sends SMS alerts directly via the paired Android phone's physical SIM card using native
 * SmsManager. Zero cloud SMS APIs, zero centralized relays, zero internet dependencies.
 */
class DirectSimSmsDispatcher(private val context: Context) {

    companion object {
        private const val TAG = "DirectSimSmsDispatcher"
        const val ACTION_SMS_SENT = "com.healthpulse.edge.SMS_SENT_ACTION"
        const val ACTION_SMS_DELIVERED = "com.healthpulse.edge.SMS_DELIVERED_ACTION"
    }

    enum class DispatchStatus {
        IDLE,
        SENDING,
        SENT,
        DELIVERED,
        FAILED
    }

    interface DispatchCallback {
        fun onStatusChanged(status: DispatchStatus, details: String)
    }

    /**
     * Formats and automatically dispatches the emergency SMS payload across configured contacts.
     */
    fun dispatchEmergencyAlert(
        eventType: String,
        hr: Float,
        spo2: Float,
        svmG: Float,
        location: Location?,
        contacts: List<EmergencyContact>,
        callback: DispatchCallback?
    ) {
        if (contacts.isEmpty()) {
            Log.w(TAG, "[SMS WARN] No emergency contacts configured. Cannot dispatch Direct-SIM SMS.")
            callback?.onStatusChanged(DispatchStatus.FAILED, "No emergency contacts configured.")
            return
        }

        val timeString = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val locationStr = if (location != null) {
            String.format(Locale.US, "%.4f° N, %.4f° E (±%.0fm)", location.latitude, location.longitude, location.accuracy)
        } else {
            "Location unavailable"
        }

        val messageBody = buildString {
            append("🚨 EMERGENCY HEALTH ALERT ($eventType Detected)\n")
            append("Patient: User (HealthPulse Companion)\n")
            append("Time: $timeString\n")
            append("Location: $locationStr\n")
            append("Vitals Snapshot: HR ${hr.toInt()} BPM | SpO2 $spo2% | Motion SVM: ${String.format(Locale.US, "%.2f", svmG)}g\n")
            append("Automated Edge-AI Emergency Alert via Direct-SIM HealthPulseEDGE.")
        }

        Log.i(TAG, "[SMS DISPATCH] Initiating Direct-SIM automated dispatch via SmsManager...")
        Log.i(TAG, "[SMS PAYLOAD]\n$messageBody")

        callback?.onStatusChanged(DispatchStatus.SENDING, "Transmitting via phone SIM card...")

        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        for (contact in contacts) {
            val sentIntent = PendingIntent.getBroadcast(
                context,
                contact.phone.hashCode(),
                Intent(ACTION_SMS_SENT).apply { putExtra("phone", contact.phone) },
                flags
            )

            val deliveredIntent = PendingIntent.getBroadcast(
                context,
                contact.phone.hashCode() + 1,
                Intent(ACTION_SMS_DELIVERED).apply { putExtra("phone", contact.phone) },
                flags
            )

            try {
                // If message exceeds 160 GSM chars, divide into parts
                val parts = smsManager.divideMessage(messageBody)
                if (parts.size > 1) {
                    val sentIntents = ArrayList<PendingIntent>().apply { repeat(parts.size) { add(sentIntent) } }
                    val deliveredIntents = ArrayList<PendingIntent>().apply { repeat(parts.size) { add(deliveredIntent) } }
                    smsManager.sendMultipartTextMessage(contact.phone, null, parts, sentIntents, deliveredIntents)
                } else {
                    smsManager.sendTextMessage(contact.phone, null, messageBody, sentIntent, deliveredIntent)
                }
                Log.i(TAG, "[SMS SUCCESS] Direct-SIM SMS dispatched to ${contact.name} (${contact.phone})")
                callback?.onStatusChanged(DispatchStatus.SENT, "Dispatched to ${contact.name} via SIM.")
            } catch (e: Exception) {
                Log.e(TAG, "[SMS ERROR] Failed to send SMS to ${contact.phone}: ${e.message}", e)
                callback?.onStatusChanged(DispatchStatus.FAILED, "Send failed: ${e.localizedMessage}")
            }
        }
    }
}

/**
 * BroadcastReceiver for SMS Sent event confirmation
 */
class SmsSentReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        val phone = intent?.getStringExtra("phone") ?: "Recipient"
        when (resultCode) {
            Activity.RESULT_OK -> {
                Log.i("SmsSentReceiver", "[SMS CONFIRM] Message successfully transmitted over cell tower to $phone.")
            }
            SmsManager.RESULT_ERROR_NO_SERVICE -> {
                Log.e("SmsSentReceiver", "[SMS ERROR] No cellular signal available to send SMS to $phone.")
            }
            SmsManager.RESULT_ERROR_RADIO_OFF -> {
                Log.e("SmsSentReceiver", "[SMS ERROR] Airplane mode is enabled; cannot send SMS to $phone.")
            }
            else -> {
                Log.e("SmsSentReceiver", "[SMS ERROR] Transmission error code: $resultCode for $phone.")
            }
        }
    }
}

/**
 * BroadcastReceiver for SMS Delivered carrier report confirmation
 */
class SmsDeliveredReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        val phone = intent?.getStringExtra("phone") ?: "Recipient"
        when (resultCode) {
            Activity.RESULT_OK -> {
                Log.i("SmsDeliveredReceiver", "[DELIVERY RECEIPT] Carrier confirmed SMS was delivered to handset of $phone.")
            }
            Activity.RESULT_CANCELED -> {
                Log.w("SmsDeliveredReceiver", "[DELIVERY WARN] Carrier reported SMS not delivered to $phone.")
            }
        }
    }
}
