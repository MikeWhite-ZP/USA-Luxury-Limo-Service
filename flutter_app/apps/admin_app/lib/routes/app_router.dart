import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:core/core.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/admin_home_screen.dart';
import '../screens/bookings_screen.dart';
import '../screens/users_screen.dart';
import '../screens/vehicles_screen.dart';
import '../screens/settings_screen.dart';

final adminRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.status == AuthStatus.authenticated;
      final isAdmin = authState.user?.isAdmin == true || 
                      authState.user?.isDispatcher == true;
      final isLoggingIn = state.matchedLocation == '/login';
      final isSplash = state.matchedLocation == '/splash';

      if (isSplash) return null;

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      if (isLoggedIn && !isAdmin) {
        return '/unauthorized';
      }

      if (isLoggedIn && isLoggingIn && isAdmin) {
        return '/admin';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const AdminSplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const AdminLoginScreen(),
      ),
      GoRoute(
        path: '/unauthorized',
        builder: (context, state) => Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.block, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                const Text(
                  'Access Denied',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text('You do not have admin privileges'),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                    context.go('/login');
                  },
                  child: const Text('Sign Out'),
                ),
              ],
            ),
          ),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => AdminShell(child: child),
        routes: [
          GoRoute(
            path: '/admin',
            builder: (context, state) => const AdminHomeScreen(),
            routes: [
              GoRoute(
                path: 'bookings',
                builder: (context, state) => const AdminBookingsScreen(),
              ),
              GoRoute(
                path: 'users',
                builder: (context, state) => const AdminUsersScreen(),
              ),
              GoRoute(
                path: 'vehicles',
                builder: (context, state) => const AdminVehiclesScreen(),
              ),
              GoRoute(
                path: 'settings',
                builder: (context, state) => const AdminSettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.error}'),
      ),
    ),
  );
});

class AdminShell extends StatelessWidget {
  final Widget child;

  const AdminShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
