import 'package:flutter/material.dart';

class TenantConfig {
  static const String tenantId = String.fromEnvironment(
    'TENANT_ID',
    defaultValue: 'default',
  );

  static const String companyName = String.fromEnvironment(
    'COMPANY_NAME',
    defaultValue: 'USA Luxury Limo',
  );

  static const String appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'USA Luxury Limo',
  );

  static const String tomtomApiKey = String.fromEnvironment(
    'TOMTOM_API_KEY',
    defaultValue: '',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.usaluxurylimo.com',
  );

  static const String _primaryColorHex = String.fromEnvironment(
    'PRIMARY_COLOR',
    defaultValue: '#D4AF37',
  );

  static const String _secondaryColorHex = String.fromEnvironment(
    'SECONDARY_COLOR',
    defaultValue: '#1A1A1A',
  );

  static const String _backgroundColorHex = String.fromEnvironment(
    'BACKGROUND_COLOR',
    defaultValue: '#0D0D0D',
  );

  static const String _textColorHex = String.fromEnvironment(
    'TEXT_COLOR',
    defaultValue: '#F5F5F5',
  );

  static Color get primaryColor => _hexToColor(_primaryColorHex);
  static Color get secondaryColor => _hexToColor(_secondaryColorHex);
  static Color get backgroundColor => _hexToColor(_backgroundColorHex);
  static Color get textColor => _hexToColor(_textColorHex);

  static Color _hexToColor(String hex) {
    final buffer = StringBuffer();
    if (hex.length == 6 || hex.length == 7) buffer.write('ff');
    buffer.write(hex.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }

  static bool get hasTomTomKey => tomtomApiKey.isNotEmpty;
}
