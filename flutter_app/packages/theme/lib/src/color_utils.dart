import 'package:flutter/material.dart';

class ColorUtils {
  static Color fromHex(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex';
    }
    return Color(int.parse(hex, radix: 16));
  }

  static String toHex(Color color) {
    return '#${color.value.toRadixString(16).substring(2).toUpperCase()}';
  }

  static Color darken(Color color, [double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(color);
    final darkened = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    return darkened.toColor();
  }

  static Color lighten(Color color, [double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(color);
    final lightened = hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0));
    return lightened.toColor();
  }

  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  static bool isDark(Color color) {
    return color.computeLuminance() < 0.5;
  }

  static Color contrastColor(Color backgroundColor) {
    return isDark(backgroundColor) ? Colors.white : Colors.black;
  }
}
