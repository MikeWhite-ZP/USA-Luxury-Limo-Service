import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:usa_luxury_limo/features/auth/presentation/screens/login_screen.dart';
import 'package:usa_luxury_limo/features/auth/presentation/screens/register_screen.dart';
import 'package:usa_luxury_limo/features/auth/presentation/screens/splash_screen.dart';
import 'package:usa_luxury_limo/features/home/presentation/screens/home_screen.dart';
import 'package:usa_luxury_limo/features/booking/presentation/screens/vehicle_selection_screen.dart';
import 'package:usa_luxury_limo/features/booking/presentation/screens/booking_confirmation_screen.dart';
import 'package:usa_luxury_limo/features/rides/presentation/screens/ride_history_screen.dart';
import 'package:usa_luxury_limo/features/profile/presentation/screens/profile_screen.dart';
import 'package:usa_luxury_limo/shared/widgets/main_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
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
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/rides',
            builder: (context, state) => const RideHistoryScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/vehicle-selection',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return VehicleSelectionScreen(bookingData: extra);
        },
      ),
      GoRoute(
        path: '/booking-confirmation',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return BookingConfirmationScreen(bookingData: extra);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
});
