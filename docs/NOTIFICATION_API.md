# Firebase Cloud Messaging (FCM) API Documentation

Untuk developer Android yang mengintegrasikan notifikasi push dengan SalmaflorisAPI.

## Base URL
```
https://your-api-base-url.com
```

## Authentication
Semua endpoint memerlukan JWT token di header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Register FCM Token
Menyimpan FCM token agar device dapat menerima notifikasi.

**Endpoint**
```
POST /notifications/token
```

**Headers**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "token": "string",
  "deviceInfo": "string (optional)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | FCM token dari Firebase Messaging |
| deviceInfo | string | No | Info device (contoh: "Samsung Galaxy S21, Android 13") |

**Response**
```json
{
  "message": "Token registered successfully"
}
```

**Error Response**
```json
{
  "message": "Failed to register FCM token",
  "status": 500
}
```

---

### 2. Remove FCM Token
Menghapus FCM token (saat logout atau user menonaktifkan notifikasi).

**Endpoint**
```
DELETE /notifications/token
```

**Headers**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "token": "string"
}
```

**Response**
```json
{
  "message": "Token removed successfully"
}
```

---

## Kapan Notifikasi Dikirim

### Untuk Admin
Notifikasi dikirim ke semua user dengan role `ADMIN` saat:
- Event: Order baru dibuat
- Title: "Order Baru"
- Body: "Order baru {invoiceNumber} dari {username}"

### Untuk User (Customer)
Notifikasi dikirim ke user yang terkait dengan order saat:

| Event | Title | Body |
|-------|-------|------|
| Pembayaran berhasil | "Pembayaran Berhasil" | "Pembayaran pesanan {invoiceNumber} berhasil" |
| Order diproses | "Pesanan Diproses" | "Pesanan {invoiceNumber} sedang diproses" |
| Order dikirim | "Pesanan Dikirim" | "Pesanan {invoiceNumber} sedang dikirim (No. Resi: {resi})" |
| Order selesai | "Pesanan Selesai" | "Pesanan {invoiceNumber} telah selesai" |
| Order dibatalkan | "Pesanan Dibatalkan" | "Pesanan {invoiceNumber} dibatalkan" |

---

## Contoh Implementasi Android

### 1. Setup Firebase di Android Project

Tambahkan ke `build.gradle` (Project level):
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

Tambahkan ke `build.gradle` (App level):
```gradle
plugins {
    id 'com.google.gms.google-services'
}

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.2'
}
```

### 2. Pastikan Firebase Token Terbaru

Di `MyFirebaseMessagingService.kt`:
```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        
        // Kirim token baru ke backend saat token berubah
        sendTokenToServer(token)
    }
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        // Handle notifikasi saat app dalam keadaan foreground
        remoteMessage.notification?.let { notification ->
            sendNotification(notification.title, notification.body)
        }
    }
    
    private fun sendTokenToServer(token: String) {
        // Panggil API untuk register token
        // Lihat contoh di bawah
    }
    
    private fun sendNotification(title: String?, body: String?) {
        // Tampilkan notifikasi ke user
        // Gunakan NotificationManager atau library lain
    }
}
```

### 3. Register Token ke Backend

Di `MainActivity.kt` atau tempat yang sesuai:
```kotlin
class MainActivity : AppCompatActivity() {
    private val apiService: ApiService by lazy { 
        RetrofitClient.getApiService() 
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Register FCM token saat login
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                registerFcmToken(token)
            }
        }
    }
    
    private fun registerFcmToken(token: String) {
        val requestBody = RegisterTokenRequest(
            token = token,
            deviceInfo = getDeviceInfo()
        )
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = apiService.registerFcmToken(requestBody)
                withContext(Dispatchers.Main) {
                    Log.d("FCM", "Token registered: ${response.message}")
                }
            } catch (e: Exception) {
                Log.e("FCM", "Failed to register token", e)
            }
        }
    }
    
    private fun getDeviceInfo(): String {
        val manufacturer = Build.MANUFACTURER
        val model = Build.MODEL
        val version = Build.VERSION.RELEASE
        return "$manufacturer $model, Android $version"
    }
    
    // Panggil ini saat logout
    private fun logout() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                removeFcmToken(task.result)
            }
        }
        // ... proses logout lainnya
    }
    
    private fun removeFcmToken(token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                apiService.removeFcmToken(RemoveTokenRequest(token))
            } catch (e: Exception) {
                Log.e("FCM", "Failed to remove token", e)
            }
        }
    }
}
```

### 4. API Service Interface (Retrofit)

Di `ApiService.kt`:
```kotlin
interface ApiService {
    
    @POST("/notifications/token")
    suspend fun registerFcmToken(
        @Body request: RegisterTokenRequest
    ): Response<RegisterTokenResponse>
    
    @DELETE("/notifications/token")
    suspend fun removeFcmToken(
        @Body request: RemoveTokenRequest
    ): Response<RemoveTokenResponse>
}

// Request/Response Data Classes
data class RegisterTokenRequest(
    @SerializedName("token") val token: String,
    @SerializedName("deviceInfo") val deviceInfo: String? = null
)

data class RegisterTokenResponse(
    @SerializedName("message") val message: String
)

data class RemoveTokenRequest(
    @SerializedName("token") val token: String
)

data class RemoveTokenResponse(
    @SerializedName("message") val message: String
)
```

### 5. Manifest Setup

Di `AndroidManifest.xml`:
```xml
<manifest>
    <application>
        <!-- Firebase Messaging Service -->
        <service
            android:name=".service.MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

---

## Testing

### Cara Test Notifikasi

1. **Android Studio Logcat**
   - Filter dengan tag "FCM" untuk melihat log saat token diregister
   - Cek log dari FirebaseMessagingService

2. **Firebase Console**
   - Buka Firebase Console → Cloud Messaging
   - Kirim test notification menggunakan FCM token dari device
   - Pastikan device menerima notifikasi

3. **API Testing**
   ```bash
   # Register token (gunakan JWT token dari login)
   curl -X POST https://api.example.com/notifications/token \
     -H "Authorization: Bearer <jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{"token": "your_fcm_token", "deviceInfo": "Test Device"}'
   
   # Test notifikasi dengan membuat order baru
   # Notifikasi akan dikirim ke semua admin
   ```

---

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Unauthorized (JWT invalid/expired) | Login ulang untuk mendapatkan JWT baru |
| 400 | Validation error (token kosong) | Pastikan FCM token tidak kosong |
| 500 | Server error | Cek koneksi internet dan retry |

### Retry Strategy

Gunakan exponential backoff untuk retry register token:
```kotlin
private fun registerFcmTokenWithRetry(token: String, retryCount: Int = 3) {
    var attempts = 0
    CoroutineScope(Dispatchers.IO).launch {
        while (attempts < retryCount) {
            try {
                apiService.registerFcmToken(RegisterTokenRequest(token))
                return@launch
            } catch (e: Exception) {
                attempts++
                if (attempts >= retryCount) {
                    Log.e("FCM", "Failed to register token after $retryCount attempts")
                } else {
                    delay(1000L * attempts) // Exponential backoff
                }
            }
        }
    }
}
```

---

## Catatan Penting

1. **Token Refresh**: FCM token bisa berubah sewaktu-waktu. Selalu panggil `sendTokenToServer()` di `onNewToken()`.

2. **Saat Login**: Selalu register FCM token yang terbaru setelah user berhasil login.

3. **Saat Logout**: Hapus FCM token dari backend untuk menghentikan notifikasi.

4. **Foreground vs Background**:
   - **Foreground**: Notifikasi ditangani di `onMessageReceived()`
   - **Background**: Notifikasi ditampilkan oleh sistem otomatis

5. **Production vs Development**:
   - Pastikan menggunakan Firebase project yang sama antara Android app dan Backend
   - Service Account Key harus sesuai dengan Firebase project yang digunakan

---

## Contoh Flow Lengkap

```
1. User Install App → Get FCM Token
2. User Login → Register FCM Token ke Backend
3. Admin Create Order → Android App menerima notifikasi (untuk admin)
4. User Make Payment → Android App menerima notifikasi (untuk user)
5. Order Status Changes → Android App menerima notifikasi (untuk user)
6. User Logout → Remove FCM Token dari Backend
```

---

## Support

Untuk pertanyaan lebih lanjut, hubungi tim backend API.
