import 'package:flutter/material.dart';
import 'package:usa_luxury_limo/core/constants/tenant_config.dart';

class AppColors {
  AppColors._();

  // Primary - Gold Luxury Accent (dynamically loaded from tenant config)
  static Color get gold => TenantConfig.primaryColor;
  static Color get goldLight => HSLColor.fromColor(gold).withLightness(0.6).toColor();
  static Color get goldDark => HSLColor.fromColor(gold).withLightness(0.35).toColor();
  static Color get goldSubtle => gold.withOpacity(0.2);
  
  // Fallback constant colors (for cases where const is required)
  static const Color goldConst = Color(0xFFD4AF37);
  static const Color goldLightConst = Color(0xFFE5C76B);
  static const Color goldDarkConst = Color(0xFFB8960C);

  // Background Colors - Deep Dark Theme (dynamically loaded)
  static Color get background => TenantConfig.backgroundColor;
  static Color get backgroundDark => HSLColor.fromColor(background).withLightness(0).toColor();
  static Color get surface => TenantConfig.secondaryColor;
  static Color get surfaceLight => HSLColor.fromColor(surface).withLightness(0.15).toColor();
  static Color get surfaceHighlight => HSLColor.fromColor(surface).withLightness(0.18).toColor();
  
  // Fallback constant colors
  static const Color backgroundConst = Color(0xFF0D0D0D);
  static const Color surfaceConst = Color(0xFF1A1A1A);

  // Text Colors
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF9E9E9E);
  static const Color textTertiary = Color(0xFF6B6B6B);
  static const Color textOnGold = Color(0xFF0D0D0D);

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color successLight = Color(0xFF81C784);
  static const Color error = Color(0xFFEF5350);
  static const Color errorLight = Color(0xFFE57373);
  static const Color warning = Color(0xFFFFB74D);
  static const Color info = Color(0xFF42A5F5);

  // Divider & Border
  static const Color divider = Color(0xFF2D2D2D);
  static const Color border = Color(0xFF3D3D3D);
  static const Color borderLight = Color(0xFF4D4D4D);

  // Overlay
  static const Color overlay = Color(0x80000000);
  static const Color overlayLight = Color(0x40000000);

  // Gradient Colors (dynamic based on tenant config)
  static LinearGradient get goldGradient => LinearGradient(
    colors: [gold, goldLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get darkGradient => LinearGradient(
    colors: [background, surface],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static LinearGradient get cardGradient => LinearGradient(
    colors: [surfaceLight, surface],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Constant gradients (for cases where const is required)
  static const LinearGradient goldGradientConst = LinearGradient(
    colors: [goldConst, goldLightConst],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkGradientConst = LinearGradient(
    colors: [backgroundConst, surfaceConst],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
