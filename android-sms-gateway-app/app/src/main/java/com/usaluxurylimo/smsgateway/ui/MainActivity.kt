package com.usaluxurylimo.smsgateway.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.usaluxurylimo.smsgateway.R
import com.usaluxurylimo.smsgateway.SmsGatewayApp
import com.usaluxurylimo.smsgateway.api.ApiClient
import com.usaluxurylimo.smsgateway.api.DeviceMetadata
import com.usaluxurylimo.smsgateway.api.RegisterRequest
import com.usaluxurylimo.smsgateway.databinding.ActivityMainBinding
import com.usaluxurylimo.smsgateway.service.SmsSenderService
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private val prefs by lazy { SmsGatewayApp.instance.securePreferences }
    private val handler = Handler(Looper.getMainLooper())
    private val updateRunnable = object : Runnable {
        override fun run() {
            updateUI()
            handler.postDelayed(this, 2000)
        }
    }
    
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.all { it.value }
        if (allGranted) {
            Toast.makeText(this, "Permissions granted!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Some permissions were denied", Toast.LENGTH_LONG).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        loadSavedData()
        setupClickListeners()
        checkPermissions()
    }
    
    override fun onResume() {
        super.onResume()
        updateUI()
        handler.post(updateRunnable)
    }
    
    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(updateRunnable)
    }
    
    private fun loadSavedData() {
        binding.serverUrlInput.setText(prefs.serverUrl ?: "")
        binding.deviceNameInput.setText(prefs.deviceName ?: Build.MODEL)
    }
    
    private fun setupClickListeners() {
        binding.registerButton.setOnClickListener {
            registerDevice()
        }
        
        binding.startServiceButton.setOnClickListener {
            if (!prefs.isRegistered) {
                showError("Please register the device first")
                return@setOnClickListener
            }
            if (!hasRequiredPermissions()) {
                requestPermissions()
                return@setOnClickListener
            }
            startSmsService()
        }
        
        binding.stopServiceButton.setOnClickListener {
            stopSmsService()
        }
    }
    
    private fun checkPermissions() {
        if (!hasRequiredPermissions()) {
            AlertDialog.Builder(this)
                .setTitle(R.string.permission_required)
                .setMessage(R.string.permission_sms_rationale)
                .setPositiveButton(R.string.grant_permissions) { _, _ ->
                    requestPermissions()
                }
                .setNegativeButton(android.R.string.cancel, null)
                .show()
        }
    }
    
    private fun hasRequiredPermissions(): Boolean {
        val smsPermission = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
        return smsPermission == PackageManager.PERMISSION_GRANTED
    }
    
    private fun requestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS
        )
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        
        permissionLauncher.launch(permissions.toTypedArray())
    }
    
    private fun registerDevice() {
        val serverUrl = binding.serverUrlInput.text.toString().trim()
        val deviceName = binding.deviceNameInput.text.toString().trim()
        val phoneNumber = binding.phoneNumberInput.text.toString().trim()
        
        if (serverUrl.isEmpty()) {
            showError("Server URL is required")
            return
        }
        
        if (deviceName.isEmpty()) {
            showError("Device name is required")
            return
        }
        
        binding.registerButton.isEnabled = false
        binding.registerButton.text = "Registering..."
        
        val deviceUuid = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        
        lifecycleScope.launch {
            try {
                val api = ApiClient.getService(serverUrl)
                
                val request = RegisterRequest(
                    deviceUuid = deviceUuid,
                    deviceName = deviceName,
                    phoneNumber = phoneNumber.ifEmpty { null },
                    metadata = DeviceMetadata(
                        model = Build.MODEL,
                        os = "Android ${Build.VERSION.RELEASE}",
                        appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "1.0.0"
                    )
                )
                
                val response = api.registerDevice(request)
                
                runOnUiThread {
                    binding.registerButton.isEnabled = true
                    binding.registerButton.text = getString(R.string.register_button)
                    
                    if (response.isSuccessful && response.body()?.success == true) {
                        val body = response.body()!!
                        
                        prefs.serverUrl = serverUrl
                        prefs.deviceName = deviceName
                        prefs.deviceUuid = deviceUuid
                        prefs.deviceId = body.deviceId
                        prefs.apiToken = body.apiToken
                        prefs.isRegistered = true
                        
                        Toast.makeText(this@MainActivity, "Device registered successfully!", Toast.LENGTH_LONG).show()
                        clearError()
                        updateUI()
                    } else {
                        val error = response.body()?.error ?: response.errorBody()?.string() ?: "Unknown error"
                        showError("Registration failed: $error")
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    binding.registerButton.isEnabled = true
                    binding.registerButton.text = getString(R.string.register_button)
                    showError("Network error: ${e.message}")
                }
            }
        }
    }
    
    private fun startSmsService() {
        val intent = Intent(this, SmsSenderService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        Toast.makeText(this, "Service started", Toast.LENGTH_SHORT).show()
        updateUI()
    }
    
    private fun stopSmsService() {
        val intent = Intent(this, SmsSenderService::class.java)
        stopService(intent)
        Toast.makeText(this, "Service stopped", Toast.LENGTH_SHORT).show()
        updateUI()
    }
    
    private fun updateUI() {
        if (prefs.isRegistered) {
            binding.registrationStatus.text = getString(R.string.status_registered)
            binding.registrationStatus.setTextColor(ContextCompat.getColor(this, R.color.success))
        } else {
            binding.registrationStatus.text = getString(R.string.status_not_registered)
            binding.registrationStatus.setTextColor(ContextCompat.getColor(this, R.color.error))
        }
        
        if (SmsSenderService.isServiceRunning) {
            binding.serviceStatus.text = getString(R.string.status_running)
            binding.serviceStatus.setTextColor(ContextCompat.getColor(this, R.color.success))
        } else {
            binding.serviceStatus.text = getString(R.string.status_stopped)
            binding.serviceStatus.setTextColor(ContextCompat.getColor(this, R.color.error))
        }
        
        binding.pendingMessages.text = SmsSenderService.pendingMessageCount.toString()
        binding.messagesSent.text = prefs.messagesSent.toString()
        binding.messagesFailed.text = prefs.messagesFailed.toString()
        
        val lastHeartbeat = prefs.lastHeartbeat
        if (lastHeartbeat > 0) {
            val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
            binding.lastHeartbeat.text = formatter.format(Date(lastHeartbeat))
        } else {
            binding.lastHeartbeat.text = "Never"
        }
        
        SmsSenderService.lastError?.let { error ->
            showError(error)
        }
        
        binding.startServiceButton.isEnabled = prefs.isRegistered && !SmsSenderService.isServiceRunning
        binding.stopServiceButton.isEnabled = SmsSenderService.isServiceRunning
    }
    
    private fun showError(message: String) {
        binding.errorText.visibility = View.VISIBLE
        binding.errorText.text = message
    }
    
    private fun clearError() {
        binding.errorText.visibility = View.GONE
        binding.errorText.text = ""
    }
}
