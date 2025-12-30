# Android SMS Gateway

This module allows the system to send SMS messages using Android phones instead of Twilio. This is a cost-effective alternative that uses native phone SMS capabilities.

## Overview

The Android SMS Gateway is an **optional, opt-in** feature that extends the existing SMS system. It:

- Does NOT replace Twilio - both providers can coexist
- Defaults to Twilio if no provider is configured
- Allows administrators to switch providers in the admin panel
- Supports multiple Android devices per system
- Maintains full backward compatibility

## Architecture

```
┌─────────────────────┐
│   SMS Request       │
│   (sendSMS)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   SMS Provider      │
│   (getSmsProvider)  │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────────────┐
│ Twilio  │ │  Android SMS    │
│Provider │ │   Provider      │
└─────────┘ └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  SMS Queue      │
            │  (Database)     │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Android Devices │
            │ (Polling API)   │
            └─────────────────┘
```

## API Endpoints

### Device Registration (Public)

**POST** `/api/android-sms/register`

Register a new Android device or re-register an existing one.

```json
{
  "deviceUuid": "unique-device-id",
  "deviceName": "My Android Phone",
  "phoneNumber": "+1234567890",
  "metadata": { "model": "Pixel 7", "os": "Android 14" }
}
```

Response:
```json
{
  "success": true,
  "deviceId": "uuid",
  "apiToken": "generated-token",
  "message": "Device registered successfully"
}
```

### Device Heartbeat

**POST** `/api/android-sms/heartbeat`

Headers:
- `Authorization: Bearer <apiToken>`
- `X-Device-UUID: <deviceUuid>`

Response:
```json
{
  "success": true,
  "timestamp": "2024-12-30T10:00:00Z",
  "pendingMessages": 5
}
```

### Get Pending Messages

**GET** `/api/android-sms/messages/pending?limit=10`

Headers:
- `Authorization: Bearer <apiToken>`
- `X-Device-UUID: <deviceUuid>`

Response:
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "phoneNumber": "+1234567890",
      "message": "Your booking is confirmed!",
      "priority": 0,
      "createdAt": "2024-12-30T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Update Message Status

**POST** `/api/android-sms/messages/:messageId/status`

```json
{
  "status": "SENT",
  "errorMessage": null
}
```

## Admin Endpoints

All admin endpoints require authentication and admin role.

### Get/Set Provider

**GET** `/api/admin/android-sms/provider`
**POST** `/api/admin/android-sms/provider`

```json
{
  "provider": "ANDROID_SMS"
}
```

### Manage Devices

**GET** `/api/admin/android-sms/devices`
**POST** `/api/admin/android-sms/devices/:deviceUuid/toggle`
**DELETE** `/api/admin/android-sms/devices/:deviceUuid`

### Queue Management

**GET** `/api/admin/android-sms/queue/stats`
**GET** `/api/admin/android-sms/queue`
**DELETE** `/api/admin/android-sms/queue/:messageId`
**POST** `/api/admin/android-sms/queue/clear-failed`

## Android App Implementation

The Android app should:

1. **Register Device** on first launch
2. **Store API Token** securely (e.g., EncryptedSharedPreferences)
3. **Poll for Messages** periodically (recommended: every 5-10 seconds when active)
4. **Send Heartbeat** to indicate device is online
5. **Send SMS** using Android's SmsManager
6. **Report Status** back to server after each send attempt

### Basic Android Code Example

```kotlin
// Register device
suspend fun registerDevice() {
    val response = api.post("/api/android-sms/register") {
        json = mapOf(
            "deviceUuid" to Settings.Secure.ANDROID_ID,
            "deviceName" to Build.MODEL,
            "phoneNumber" to getPhoneNumber()
        )
    }
    saveToken(response.apiToken)
}

// Poll and send messages
suspend fun pollAndSend() {
    val messages = api.get("/api/android-sms/messages/pending")
    
    for (msg in messages) {
        try {
            SmsManager.getDefault().sendTextMessage(
                msg.phoneNumber, null, msg.message, null, null
            )
            api.post("/api/android-sms/messages/${msg.id}/status") {
                json = mapOf("status" to "SENT")
            }
        } catch (e: Exception) {
            api.post("/api/android-sms/messages/${msg.id}/status") {
                json = mapOf("status" to "FAILED", "errorMessage" to e.message)
            }
        }
    }
}
```

## Database Tables

### android_sms_devices

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| device_uuid | VARCHAR(100) | Unique device identifier |
| device_name | VARCHAR(100) | Human-readable device name |
| api_token | VARCHAR(255) | Authentication token |
| last_heartbeat | TIMESTAMP | Last heartbeat timestamp |
| is_active | BOOLEAN | Whether device is active |
| phone_number | VARCHAR(30) | Device's phone number |
| metadata | JSONB | Additional device info |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### android_sms_queue

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| phone_number | VARCHAR(30) | Destination phone number |
| message | TEXT | SMS message content |
| status | VARCHAR(20) | PENDING/SENT/FAILED/EXPIRED |
| device_uuid | VARCHAR(100) | Device that claimed this message |
| error_message | TEXT | Error details if failed |
| priority | INTEGER | Message priority (higher = urgent) |
| retry_count | INTEGER | Number of retry attempts |
| max_retries | INTEGER | Maximum retry attempts |
| scheduled_at | TIMESTAMP | Scheduled send time |
| sent_at | TIMESTAMP | Actual send time |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Migration

Run the SQL migration script:

```bash
psql $DATABASE_URL < deployment/sql/005_android_sms_gateway.sql
```

Or use Drizzle:

```bash
npm run db:push
```

## Security Considerations

1. **API Tokens** - Each device gets a unique token that should be stored securely
2. **Device Authentication** - All message endpoints require valid token + device UUID
3. **Message Isolation** - Devices can only claim and update their own messages
4. **Admin-Only Management** - Provider switching and device management require admin role

## Backward Compatibility

- If `SMS_PROVIDER` setting doesn't exist, system defaults to TWILIO
- Existing Twilio configuration remains unchanged
- All existing SMS functions continue to work
- No changes required to existing code that uses `sendSMS()`
