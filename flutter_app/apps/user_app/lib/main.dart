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
    appType: AppType.user,
    tenantSlug: tenantSlug,
    apiBaseUrl: apiBaseUrl,
  );

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    const ProviderScope(
      child: UserApp(),
    ),
  );
}

class UserApp extends ConsumerStatefulWidget {
  const UserApp({super.key});

  @override
  ConsumerState<UserApp> createState() => _UserAppState();
}

class _UserAppState extends ConsumerState<UserApp> {
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
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: tenantConfig?.name ?? 'USA Luxury Limo',
      debugShowCheckedModeBanner: false,
      theme: themeState.lightTheme,
      darkTheme: themeState.darkTheme,
      themeMode: themeState.themeMode,
      routerConfig: router,
    );
  }
}
