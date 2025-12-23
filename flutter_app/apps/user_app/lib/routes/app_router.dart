import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:core/core.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/passenger/passenger_home_screen.dart';
import '../screens/passenger/booking_screen.dart';
import '../screens/passenger/bookings_list_screen.dart';
import '../screens/passenger/invoices_screen.dart';
import '../screens/passenger/profile_screen.dart';
import '../screens/driver/driver_home_screen.dart';
import '../screens/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.status == AuthStatus.authenticated;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';
      final isSplash = state.matchedLocation == '/splash';

      if (isSplash) return null;

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      if (isLoggedIn && isLoggingIn) {
        final user = authState.user;
        if (user?.isDriver == true) {
          return '/driver';
        }
        return '/passenger';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => PassengerShell(child: child),
        routes: [
          GoRoute(
            path: '/passenger',
            builder: (context, state) => const PassengerHomeScreen(),
            routes: [
              GoRoute(
                path: 'book',
                builder: (context, state) => const BookingScreen(),
              ),
              GoRoute(
                path: 'bookings',
                builder: (context, state) => const BookingsListScreen(),
              ),
              GoRoute(
                path: 'invoices',
                builder: (context, state) => const InvoicesScreen(),
              ),
              GoRoute(
                path: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
              GoRoute(
                path: 'settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => DriverShell(child: child),
        routes: [
          GoRoute(
            path: '/driver',
            builder: (context, state) => const DriverHomeScreen(),
            routes: [
              GoRoute(
                path: 'settings',
                builder: (context, state) => const SettingsScreen(),
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

class PassengerShell extends StatelessWidget {
  final Widget child;

  const PassengerShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return child;
  }
}

class DriverShell extends StatelessWidget {
  final Widget child;

  const DriverShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
