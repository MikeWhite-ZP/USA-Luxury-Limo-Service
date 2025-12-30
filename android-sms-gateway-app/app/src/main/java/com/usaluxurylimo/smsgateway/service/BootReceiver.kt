package com.usaluxurylimo.smsgateway.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.usaluxurylimo.smsgateway.SmsGatewayApp

class BootReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "BootReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed, checking if service should start")
            
            val prefs = SmsGatewayApp.instance.securePreferences
            
            if (prefs.isRegistered && !prefs.apiToken.isNullOrEmpty()) {
                Log.d(TAG, "Device is registered, starting SMS service")
                
                val serviceIntent = Intent(context, SmsSenderService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } else {
                Log.d(TAG, "Device not registered, service not started")
            }
        }
    }
}
