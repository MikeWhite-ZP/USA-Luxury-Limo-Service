import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/network/api_result.dart';
import 'package:usa_luxury_limo/features/auth/data/auth_repository.dart';
import 'package:usa_luxury_limo/shared/models/user_model.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);

    final isLoggedIn = await _repository.isLoggedIn();
    if (isLoggedIn) {
      final result = await _repository.getCurrentUser();
      result.when(
        success: (user) {
          state = AuthState(status: AuthStatus.authenticated, user: user);
        },
        error: (message, _) {
          state = const AuthState(status: AuthStatus.unauthenticated);
        },
        loading: () {},
      );
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);

    final result = await _repository.login(email: email, password: password);

    return result.when(
      success: (user) {
        state = AuthState(status: AuthStatus.authenticated, user: user);
        return true;
      },
      error: (message, _) {
        state = AuthState(
          status: AuthStatus.error,
          errorMessage: message,
        );
        return false;
      },
      loading: () => false,
    );
  }

  Future<bool> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);

    final result = await _repository.register(
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      phone: phone,
    );

    return result.when(
      success: (user) {
        state = AuthState(status: AuthStatus.authenticated, user: user);
        return true;
      },
      error: (message, _) {
        state = AuthState(
          status: AuthStatus.error,
          errorMessage: message,
        );
        return false;
      },
      loading: () => false,
    );
  }

  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);
    await _repository.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<bool> forgotPassword(String email) async {
    final result = await _repository.forgotPassword(email);
    return result.isSuccess;
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});
