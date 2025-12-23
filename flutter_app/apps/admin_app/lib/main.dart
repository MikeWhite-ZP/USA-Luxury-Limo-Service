import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import 'package:theme/theme.dart';
import 'routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const tenantSlug = String.fromEnvironment('TENANT_SLUG', defaultValue: 'default');
  const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.usaluxurylimo.com');
  const flavorStr = String.fromEnvironment('FLAVOR', defaultValue: 'production');

  final flavor = flavorStr == 'development' 
    ? AppFlavor.development 
    : flavorStr == 'staging' 
      ? AppFlavor.staging 
      : AppFlavor.production;

  AppConfig.initialize(
    flavor: flavor,
    appType: AppType.admin,
    tenantSlug: tenantSlug,
    apiBaseUrl: apiBaseUrl,
  );

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    const ProviderScope(
      child: AdminApp(),
    ),
  );
}

class AdminApp extends ConsumerStatefulWidget {
  const AdminApp({super.key});

  @override
  ConsumerState<AdminApp> createState() => _AdminAppState();
}

class _AdminAppState extends ConsumerState<AdminApp> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    await ref.read(themeProvider.notifier).initialize();
    await ref.read(tenantProvider.notifier).loadTenantConfig();
    await ref.read(authProvider.notifier).checkAuthStatus();

    final tenantConfig = ref.read(tenantConfigProvider);
    if (tenantConfig != null) {
      ref.read(themeProvider.notifier).updateFromTenantConfig(tenantConfig);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeState = ref.watch(themeProvider);
    final tenantConfig = ref.watch(tenantConfigProvider);
    final router = ref.watch(adminRouterProvider);

    return MaterialApp.router(
      title: '${tenantConfig?.name ?? 'USA Luxury Limo'} - Admin',
      debugShowCheckedModeBanner: false,
      theme: themeState.lightTheme,
      darkTheme: themeState.darkTheme,
      themeMode: themeState.themeMode,
      routerConfig: router,
    );
  }
}
