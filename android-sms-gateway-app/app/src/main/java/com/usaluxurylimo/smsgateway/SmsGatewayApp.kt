package com.usaluxurylimo.smsgateway

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.usaluxurylimo.smsgateway.util.SecurePreferences

class SmsGatewayApp : Application() {
    
    lateinit var securePreferences: SecurePreferences
        private set
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        securePreferences = SecurePreferences(this)
        createNotificationChannel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    companion object {
        const val NOTIFICATION_CHANNEL_ID = "sms_gateway_service"
        const val NOTIFICATION_ID = 1001
        
        lateinit var instance: SmsGatewayApp
            private set
    }
}
