import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/tenant_config.dart';
import '../models/user.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyUser = 'user_data';
  static const _keyTenantConfig = 'tenant_config';
  static const _keyThemeMode = 'theme_mode';
  static const _keyOnboardingComplete = 'onboarding_complete';

  static Future<void> saveUser(User user) async {
    await _storage.write(key: _keyUser, value: jsonEncode(user.toJson()));
  }

  static Future<User?> getUser() async {
    final data = await _storage.read(key: _keyUser);
    if (data != null) {
      return User.fromJson(jsonDecode(data));
    }
    return null;
  }

  static Future<void> clearUser() async {
    await _storage.delete(key: _keyUser);
  }

  static Future<void> saveTenantConfig(TenantConfig config) async {
    await _storage.write(key: _keyTenantConfig, value: jsonEncode(config.toJson()));
  }

  static Future<TenantConfig?> getTenantConfig() async {
    final data = await _storage.read(key: _keyTenantConfig);
    if (data != null) {
      return TenantConfig.fromJson(jsonDecode(data));
    }
    return null;
  }

  static Future<void> clearTenantConfig() async {
    await _storage.delete(key: _keyTenantConfig);
  }

  static Future<void> setThemeMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyThemeMode, mode);
  }

  static Future<String> getThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyThemeMode) ?? 'system';
  }

  static Future<void> setOnboardingComplete(bool complete) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyOnboardingComplete, complete);
  }

  static Future<bool> isOnboardingComplete() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyOnboardingComplete) ?? false;
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
