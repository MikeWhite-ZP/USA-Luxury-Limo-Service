import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary - Gold Luxury Accent
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFE5C76B);
  static const Color goldDark = Color(0xFFB8960C);
  static const Color goldSubtle = Color(0x33D4AF37);

  // Background Colors - Deep Dark Theme
  static const Color background = Color(0xFF0D0D0D);
  static const Color backgroundDark = Color(0xFF000000);
  static const Color surface = Color(0xFF1A1A1A);
  static const Color surfaceLight = Color(0xFF252525);
  static const Color surfaceHighlight = Color(0xFF2D2D2D);

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

  // Gradient Colors
  static const LinearGradient goldGradient = LinearGradient(
    colors: [gold, goldLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkGradient = LinearGradient(
    colors: [background, surface],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [surfaceLight, surface],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
