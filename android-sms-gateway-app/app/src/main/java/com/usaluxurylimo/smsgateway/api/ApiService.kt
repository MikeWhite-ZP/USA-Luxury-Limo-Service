package com.usaluxurylimo.smsgateway.api

import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @POST("api/android-sms/register")
    suspend fun registerDevice(
        @Body request: RegisterRequest
    ): Response<RegisterResponse>
    
    @POST("api/android-sms/heartbeat")
    suspend fun sendHeartbeat(
        @Header("Authorization") authorization: String,
        @Header("X-Device-UUID") deviceUuid: String
    ): Response<HeartbeatResponse>
    
    @GET("api/android-sms/messages/pending")
    suspend fun getPendingMessages(
        @Header("Authorization") authorization: String,
        @Header("X-Device-UUID") deviceUuid: String,
        @Query("limit") limit: Int = 10
    ): Response<PendingMessagesResponse>
    
    @POST("api/android-sms/messages/{messageId}/status")
    suspend fun updateMessageStatus(
        @Header("Authorization") authorization: String,
        @Header("X-Device-UUID") deviceUuid: String,
        @Path("messageId") messageId: String,
        @Body request: StatusUpdateRequest
    ): Response<StatusUpdateResponse>
}
