package com.usaluxurylimo.smsgateway.service

import android.Manifest
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.usaluxurylimo.smsgateway.R
import com.usaluxurylimo.smsgateway.SmsGatewayApp
import com.usaluxurylimo.smsgateway.api.ApiClient
import com.usaluxurylimo.smsgateway.api.StatusUpdateRequest
import com.usaluxurylimo.smsgateway.ui.MainActivity
import kotlinx.coroutines.*

class SmsSenderService : Service() {
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isRunning = false
    private var pollingJob: Job? = null
    
    companion object {
        private const val TAG = "SmsSenderService"
        var isServiceRunning = false
            private set
        var lastError: String? = null
            private set
        var pendingMessageCount = 0
            private set
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service starting...")
        
        startForeground(SmsGatewayApp.NOTIFICATION_ID, createNotification())
        
        if (!isRunning) {
            isRunning = true
            isServiceRunning = true
            startPolling()
        }
        
        return START_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
        isRunning = false
        isServiceRunning = false
        pollingJob?.cancel()
        serviceScope.cancel()
    }
    
    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, SmsGatewayApp.NOTIFICATION_CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
    
    private fun startPolling() {
        val prefs = SmsGatewayApp.instance.securePreferences
        
        pollingJob = serviceScope.launch {
            while (isActive && isRunning) {
                try {
                    val serverUrl = prefs.serverUrl
                    val apiToken = prefs.apiToken
                    val deviceUuid = prefs.deviceUuid
                    
                    if (serverUrl.isNullOrEmpty() || apiToken.isNullOrEmpty() || deviceUuid.isNullOrEmpty()) {
                        Log.w(TAG, "Missing credentials, skipping poll")
                        delay(10000)
                        continue
                    }
                    
                    val api = ApiClient.getService(serverUrl)
                    val authHeader = "Bearer $apiToken"
                    
                    val heartbeatResponse = api.sendHeartbeat(authHeader, deviceUuid)
                    if (heartbeatResponse.isSuccessful) {
                        prefs.lastHeartbeat = System.currentTimeMillis()
                        pendingMessageCount = heartbeatResponse.body()?.pendingMessages ?: 0
                        lastError = null
                    }
                    
                    val messagesResponse = api.getPendingMessages(authHeader, deviceUuid, 5)
                    
                    if (messagesResponse.isSuccessful) {
                        val messages = messagesResponse.body()?.messages ?: emptyList()
                        
                        for (message in messages) {
                            sendSms(serverUrl, apiToken, deviceUuid, message.id, message.phoneNumber, message.message)
                            delay(500)
                        }
                    } else {
                        lastError = "Failed to fetch messages: ${messagesResponse.code()}"
                        Log.e(TAG, lastError!!)
                    }
                    
                } catch (e: Exception) {
                    lastError = "Polling error: ${e.message}"
                    Log.e(TAG, "Polling error", e)
                }
                
                delay((prefs.pollIntervalSeconds * 1000).toLong())
            }
        }
    }
    
    private suspend fun sendSms(
        serverUrl: String,
        apiToken: String,
        deviceUuid: String,
        messageId: String,
        phoneNumber: String,
        message: String
    ) {
        val prefs = SmsGatewayApp.instance.securePreferences
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) 
            != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "SMS permission not granted")
            reportStatus(serverUrl, apiToken, deviceUuid, messageId, "FAILED", "SMS permission not granted")
            prefs.incrementMessagesFailed()
            return
        }
        
        try {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
            
            val parts = smsManager.divideMessage(message)
            if (parts.size > 1) {
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            }
            
            Log.d(TAG, "SMS sent successfully to $phoneNumber")
            reportStatus(serverUrl, apiToken, deviceUuid, messageId, "SENT", null)
            prefs.incrementMessagesSent()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS to $phoneNumber", e)
            reportStatus(serverUrl, apiToken, deviceUuid, messageId, "FAILED", e.message)
            prefs.incrementMessagesFailed()
        }
    }
    
    private suspend fun reportStatus(
        serverUrl: String,
        apiToken: String,
        deviceUuid: String,
        messageId: String,
        status: String,
        errorMessage: String?
    ) {
        try {
            val api = ApiClient.getService(serverUrl)
            val authHeader = "Bearer $apiToken"
            val request = StatusUpdateRequest(status, errorMessage)
            
            val response = api.updateMessageStatus(authHeader, deviceUuid, messageId, request)
            
            if (response.isSuccessful) {
                Log.d(TAG, "Status reported: $status for message $messageId")
            } else {
                Log.e(TAG, "Failed to report status: ${response.code()}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reporting status", e)
        }
    }
}
