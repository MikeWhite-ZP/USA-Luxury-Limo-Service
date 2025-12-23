import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import 'app_theme.dart';

enum ThemeModeSetting { light, dark, system }

class ThemeState {
  final ThemeModeSetting mode;
  final ThemeData lightTheme;
  final ThemeData darkTheme;

  const ThemeState({
    required this.mode,
    required this.lightTheme,
    required this.darkTheme,
  });

  ThemeState copyWith({
    ThemeModeSetting? mode,
    ThemeData? lightTheme,
    ThemeData? darkTheme,
  }) {
    return ThemeState(
      mode: mode ?? this.mode,
      lightTheme: lightTheme ?? this.lightTheme,
      darkTheme: darkTheme ?? this.darkTheme,
    );
  }

  ThemeMode get themeMode {
    switch (mode) {
      case ThemeModeSetting.light:
        return ThemeMode.light;
      case ThemeModeSetting.dark:
        return ThemeMode.dark;
      case ThemeModeSetting.system:
        return ThemeMode.system;
    }
  }
}

class ThemeNotifier extends StateNotifier<ThemeState> {
  ThemeNotifier()
      : super(ThemeState(
          mode: ThemeModeSetting.system,
          lightTheme: AppTheme.defaultLight(),
          darkTheme: AppTheme.defaultDark(),
        ));

  Future<void> initialize() async {
    final savedMode = await SecureStorage.getThemeMode();
    final mode = _parseMode(savedMode);
    state = state.copyWith(mode: mode);
  }

  void setThemeMode(ThemeModeSetting mode) {
    state = state.copyWith(mode: mode);
    SecureStorage.setThemeMode(_modeToString(mode));
  }

  void updateFromTenantConfig(TenantConfig config) {
    state = state.copyWith(
      lightTheme: AppTheme.fromTenantColors(config.lightColors, isDark: false),
      darkTheme: AppTheme.fromTenantColors(config.darkColors, isDark: true),
    );
  }

  ThemeModeSetting _parseMode(String mode) {
    switch (mode) {
      case 'light':
        return ThemeModeSetting.light;
      case 'dark':
        return ThemeModeSetting.dark;
      default:
        return ThemeModeSetting.system;
    }
  }

  String _modeToString(ThemeModeSetting mode) {
    switch (mode) {
      case ThemeModeSetting.light:
        return 'light';
      case ThemeModeSetting.dark:
        return 'dark';
      case ThemeModeSetting.system:
        return 'system';
    }
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>((ref) {
  return ThemeNotifier();
});

final themeModeProvider = Provider<ThemeMode>((ref) {
  return ref.watch(themeProvider).themeMode;
});

final lightThemeProvider = Provider<ThemeData>((ref) {
  return ref.watch(themeProvider).lightTheme;
});

final darkThemeProvider = Provider<ThemeData>((ref) {
  return ref.watch(themeProvider).darkTheme;
});
