package com.usaluxurylimo.smsgateway.api

import com.google.gson.annotations.SerializedName

data class RegisterRequest(
    @SerializedName("deviceUuid") val deviceUuid: String,
    @SerializedName("deviceName") val deviceName: String,
    @SerializedName("phoneNumber") val phoneNumber: String?,
    @SerializedName("metadata") val metadata: DeviceMetadata
)

data class DeviceMetadata(
    @SerializedName("model") val model: String,
    @SerializedName("os") val os: String,
    @SerializedName("appVersion") val appVersion: String
)

data class RegisterResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("deviceId") val deviceId: String?,
    @SerializedName("apiToken") val apiToken: String?,
    @SerializedName("message") val message: String?,
    @SerializedName("error") val error: String?
)

data class HeartbeatResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("timestamp") val timestamp: String?,
    @SerializedName("pendingMessages") val pendingMessages: Int,
    @SerializedName("error") val error: String?
)

data class PendingMessagesResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("messages") val messages: List<SmsMessage>,
    @SerializedName("count") val count: Int,
    @SerializedName("error") val error: String?
)

data class SmsMessage(
    @SerializedName("id") val id: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("message") val message: String,
    @SerializedName("priority") val priority: Int,
    @SerializedName("createdAt") val createdAt: String
)

data class StatusUpdateRequest(
    @SerializedName("status") val status: String,
    @SerializedName("errorMessage") val errorMessage: String?
)

data class StatusUpdateResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("messageId") val messageId: String?,
    @SerializedName("status") val status: String?,
    @SerializedName("error") val error: String?
)
