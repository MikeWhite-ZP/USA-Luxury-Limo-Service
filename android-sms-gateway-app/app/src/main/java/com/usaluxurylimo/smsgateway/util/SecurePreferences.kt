package com.usaluxurylimo.smsgateway.util

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecurePreferences(context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "sms_gateway_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    companion object {
        private const val KEY_API_TOKEN = "api_token"
        private const val KEY_DEVICE_UUID = "device_uuid"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_IS_REGISTERED = "is_registered"
        private const val KEY_POLL_INTERVAL = "poll_interval"
        private const val KEY_MESSAGES_SENT = "messages_sent"
        private const val KEY_MESSAGES_FAILED = "messages_failed"
        private const val KEY_LAST_HEARTBEAT = "last_heartbeat"
    }
    
    var apiToken: String?
        get() = prefs.getString(KEY_API_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_API_TOKEN, value).apply()
    
    var deviceUuid: String?
        get() = prefs.getString(KEY_DEVICE_UUID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_UUID, value).apply()
    
    var deviceId: String?
        get() = prefs.getString(KEY_DEVICE_ID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()
    
    var serverUrl: String?
        get() = prefs.getString(KEY_SERVER_URL, null)
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value).apply()
    
    var deviceName: String?
        get() = prefs.getString(KEY_DEVICE_NAME, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_NAME, value).apply()
    
    var isRegistered: Boolean
        get() = prefs.getBoolean(KEY_IS_REGISTERED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_REGISTERED, value).apply()
    
    var pollIntervalSeconds: Int
        get() = prefs.getInt(KEY_POLL_INTERVAL, 10)
        set(value) = prefs.edit().putInt(KEY_POLL_INTERVAL, value).apply()
    
    var messagesSent: Int
        get() = prefs.getInt(KEY_MESSAGES_SENT, 0)
        set(value) = prefs.edit().putInt(KEY_MESSAGES_SENT, value).apply()
    
    var messagesFailed: Int
        get() = prefs.getInt(KEY_MESSAGES_FAILED, 0)
        set(value) = prefs.edit().putInt(KEY_MESSAGES_FAILED, value).apply()
    
    var lastHeartbeat: Long
        get() = prefs.getLong(KEY_LAST_HEARTBEAT, 0)
        set(value) = prefs.edit().putLong(KEY_LAST_HEARTBEAT, value).apply()
    
    fun incrementMessagesSent() {
        messagesSent = messagesSent + 1
    }
    
    fun incrementMessagesFailed() {
        messagesFailed = messagesFailed + 1
    }
    
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
