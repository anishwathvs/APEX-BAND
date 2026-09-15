package com.healthpulse.edge;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * DirectSmsPlugin for Capacitor
 * Bridges JavaScript to Android's native SmsManager for Direct-SIM emergency SMS dispatch.
 */
@CapacitorPlugin(
    name = "DirectSmsPlugin",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.SEND_SMS }
        )
    }
)
public class DirectSmsPlugin extends Plugin {

    private static final String TAG = "DirectSmsPlugin";
    private static final String ACTION_SMS_SENT = "com.healthpulse.edge.DIRECT_SMS_SENT";
    private static final String ACTION_SMS_DELIVERED = "com.healthpulse.edge.DIRECT_SMS_DELIVERED";

    @PluginMethod
    public void sendRealSms(PluginCall call) {
        String number = call.getString("number");
        String message = call.getString("message");

        if (number == null || number.trim().isEmpty()) {
            call.reject("Recipient phone number is required");
            return;
        }

        if (message == null || message.trim().isEmpty()) {
            call.reject("SMS message body is required");
            return;
        }

        if (!getPermissionState("sms").equals(com.getcapacitor.PermissionState.GRANTED)) {
            requestPermissionForAlias("sms", call, "sendSmsPermissionCallback");
            return;
        }

        executeSendSms(call, number, message);
    }

    @PermissionCallback
    private void sendSmsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms").equals(com.getcapacitor.PermissionState.GRANTED)) {
            String number = call.getString("number");
            String message = call.getString("message");
            executeSendSms(call, number, message);
        } else {
            JSObject ret = new JSObject();
            ret.put("status", "failed");
            ret.put("reason", "SEND_SMS permission denied by user");
            call.resolve(ret);
        }
    }

    private void executeSendSms(PluginCall call, String number, String message) {
        Context context = getContext();
        Log.i(TAG, "[DIRECT-SIM] Preparing multipart SMS dispatch to: " + number);

        try {
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                smsManager = context.getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }

            if (smsManager == null) {
                JSObject ret = new JSObject();
                ret.put("status", "failed");
                ret.put("reason", "SmsManager unavailable (no SIM or telephony hardware)");
                call.resolve(ret);
                return;
            }

            ArrayList<String> parts = smsManager.divideMessage(message);
            int partsCount = parts.size();

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            Intent sentIntent = new Intent(ACTION_SMS_SENT);
            sentIntent.putExtra("number", number);
            PendingIntent sentPI = PendingIntent.getBroadcast(context, (int) System.currentTimeMillis(), sentIntent, flags);

            Intent deliveredIntent = new Intent(ACTION_SMS_DELIVERED);
            deliveredIntent.putExtra("number", number);
            PendingIntent deliveredPI = PendingIntent.getBroadcast(context, (int) (System.currentTimeMillis() + 1), deliveredIntent, flags);

            ArrayList<PendingIntent> sentIntents = new ArrayList<>();
            ArrayList<PendingIntent> deliveredIntents = new ArrayList<>();

            for (int i = 0; i < partsCount; i++) {
                sentIntents.add(sentPI);
                deliveredIntents.add(deliveredPI);
            }

            // Register dynamic receiver for real carrier transmission confirmation
            BroadcastReceiver sentReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctx, Intent intent) {
                    try {
                        ctx.unregisterReceiver(this);
                    } catch (Exception ignored) {}

                    int resultCode = getResultCode();
                    JSObject ret = new JSObject();

                    if (resultCode == Activity.RESULT_OK) {
                        Log.i(TAG, "[DIRECT-SIM SUCCESS] Carrier transmitted SMS over cell tower to " + number);
                        ret.put("status", "sent");
                        ret.put("recipient", number);
                        ret.put("parts", partsCount);
                        ret.put("timestamp", System.currentTimeMillis());
                        ret.put("details", "SMS transmitted successfully via device SIM.");
                        call.resolve(ret);
                    } else {
                        String errorReason = "SMS send failed (Code: " + resultCode + ")";
                        if (resultCode == SmsManager.RESULT_ERROR_NO_SERVICE) {
                            errorReason = "No cellular service / tower signal.";
                        } else if (resultCode == SmsManager.RESULT_ERROR_RADIO_OFF) {
                            errorReason = "Airplane mode is active.";
                        } else if (resultCode == SmsManager.RESULT_ERROR_NULL_PDU) {
                            errorReason = "Null PDU (SIM error).";
                        }
                        Log.e(TAG, "[DIRECT-SIM ERROR] " + errorReason);
                        ret.put("status", "failed");
                        ret.put("recipient", number);
                        ret.put("reason", errorReason);
                        call.resolve(ret);
                    }
                }
            };

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(sentReceiver, new IntentFilter(ACTION_SMS_SENT), Context.RECEIVER_NOT_EXPORTED);
            } else {
                context.registerReceiver(sentReceiver, new IntentFilter(ACTION_SMS_SENT));
            }

            // Execute the native multipart SMS transmission via phone's SIM
            smsManager.sendMultipartTextMessage(number, null, parts, sentIntents, deliveredIntents);
            Log.i(TAG, "[DIRECT-SIM] sendMultipartTextMessage called for " + partsCount + " parts.");

        } catch (Exception e) {
            Log.e(TAG, "[DIRECT-SIM EXCEPTION] " + e.getMessage(), e);
            JSObject ret = new JSObject();
            ret.put("status", "failed");
            ret.put("recipient", number);
            ret.put("reason", "Native exception: " + e.getMessage());
            call.resolve(ret);
        }
    }
}
