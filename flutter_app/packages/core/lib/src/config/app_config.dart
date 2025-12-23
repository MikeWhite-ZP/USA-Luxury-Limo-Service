enum AppFlavor { development, staging, production }
enum AppType { user, admin }

class AppConfig {
  static late AppFlavor flavor;
  static late AppType appType;
  static late String tenantSlug;
  static late String apiBaseUrl;

  static void initialize({
    required AppFlavor flavor,
    required AppType appType,
    required String tenantSlug,
    required String apiBaseUrl,
  }) {
    AppConfig.flavor = flavor;
    AppConfig.appType = appType;
    AppConfig.tenantSlug = tenantSlug;
    AppConfig.apiBaseUrl = apiBaseUrl;
  }

  static bool get isDevelopment => flavor == AppFlavor.development;
  static bool get isProduction => flavor == AppFlavor.production;
  static bool get isUserApp => appType == AppType.user;
  static bool get isAdminApp => appType == AppType.admin;

  static String get appName => isUserApp ? 'USA Luxury Limo' : 'Admin Panel';
  
  static String get brandingEndpoint => '$apiBaseUrl/api/branding';
  static String get authEndpoint => '$apiBaseUrl/api/auth';
}
