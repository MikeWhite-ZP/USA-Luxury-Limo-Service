import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:core/core.dart';
import 'color_utils.dart';

class AppTheme {
  static ThemeData fromTenantColors(TenantColors colors, {required bool isDark}) {
    final primaryColor = ColorUtils.fromHex(colors.primary);
    final backgroundColor = ColorUtils.fromHex(colors.background);
    final foregroundColor = ColorUtils.fromHex(colors.foreground);
    final cardColor = ColorUtils.fromHex(colors.card);
    final mutedColor = ColorUtils.fromHex(colors.muted);
    final borderColor = ColorUtils.fromHex(colors.border);

    return ThemeData(
      useMaterial3: true,
      brightness: isDark ? Brightness.dark : Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      cardColor: cardColor,
      dividerColor: borderColor,
      
      colorScheme: ColorScheme(
        brightness: isDark ? Brightness.dark : Brightness.light,
        primary: primaryColor,
        onPrimary: Colors.white,
        secondary: ColorUtils.fromHex(colors.secondary),
        onSecondary: Colors.white,
        surface: cardColor,
        onSurface: foregroundColor,
        error: Colors.red.shade600,
        onError: Colors.white,
      ),

      textTheme: GoogleFonts.interTextTheme(
        TextTheme(
          displayLarge: TextStyle(color: foregroundColor),
          displayMedium: TextStyle(color: foregroundColor),
          displaySmall: TextStyle(color: foregroundColor),
          headlineLarge: TextStyle(color: foregroundColor),
          headlineMedium: TextStyle(color: foregroundColor),
          headlineSmall: TextStyle(color: foregroundColor),
          titleLarge: TextStyle(color: foregroundColor, fontWeight: FontWeight.w600),
          titleMedium: TextStyle(color: foregroundColor, fontWeight: FontWeight.w500),
          titleSmall: TextStyle(color: foregroundColor, fontWeight: FontWeight.w500),
          bodyLarge: TextStyle(color: foregroundColor),
          bodyMedium: TextStyle(color: foregroundColor),
          bodySmall: TextStyle(color: ColorUtils.fromHex(colors.mutedForeground)),
          labelLarge: TextStyle(color: foregroundColor, fontWeight: FontWeight.w500),
          labelMedium: TextStyle(color: foregroundColor),
          labelSmall: TextStyle(color: ColorUtils.fromHex(colors.mutedForeground)),
        ),
      ),

      appBarTheme: AppBarTheme(
        backgroundColor: cardColor,
        foregroundColor: foregroundColor,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: foregroundColor),
      ),

      cardTheme: CardTheme(
        color: cardColor,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: borderColor, width: 1),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: BorderSide(color: primaryColor.withOpacity(0.3)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: mutedColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.red.shade600),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(color: ColorUtils.fromHex(colors.mutedForeground)),
        labelStyle: TextStyle(color: ColorUtils.fromHex(colors.mutedForeground)),
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cardColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: ColorUtils.fromHex(colors.mutedForeground),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? Colors.grey.shade800 : Colors.grey.shade900,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),

      dialogTheme: DialogTheme(
        backgroundColor: cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: cardColor,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
    );
  }

  static ThemeData defaultLight() {
    return fromTenantColors(TenantColors.defaultLight(), isDark: false);
  }

  static ThemeData defaultDark() {
    return fromTenantColors(TenantColors.defaultDark(), isDark: true);
  }
}
