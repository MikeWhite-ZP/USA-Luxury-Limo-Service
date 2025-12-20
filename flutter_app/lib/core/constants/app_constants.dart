class AppConstants {
  AppConstants._();

  static const String appName = 'USA Luxury Limo';
  static const String appTagline = 'Premium Luxury Transportation';

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String onboardingCompleteKey = 'onboarding_complete';

  // Animation Durations
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);
  static const Duration splashDuration = Duration(seconds: 3);

  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int phoneNumberLength = 10;

  // Map Settings
  static const double defaultMapZoom = 15.0;
  static const double defaultLatitude = 40.7128;
  static const double defaultLongitude = -74.0060;

  // Pagination
  static const int defaultPageSize = 20;

  // Image Settings
  static const int maxImageSizeKb = 5120;
  static const double avatarSize = 120.0;
}
