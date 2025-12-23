import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../models/user.dart';
import '../storage/secure_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final bool isLoading;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.isLoading = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    bool? isLoading,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;

  AuthNotifier(this._apiClient) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final savedUser = await SecureStorage.getUser();
      if (savedUser != null) {
        final response = await _apiClient.get(_apiClient.endpoints.currentUser);
        if (response.statusCode == 200 && response.data != null) {
          final user = User.fromJson(response.data);
          await SecureStorage.saveUser(user);
          state = AuthState(
            status: AuthStatus.authenticated,
            user: user,
            isLoading: false,
          );
        } else {
          await _clearAuth();
        }
      } else {
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          isLoading: false,
        );
      }
    } catch (e) {
      await _clearAuth();
    }
  }

  Future<bool> login({
    required String username,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        _apiClient.endpoints.login,
        data: {
          'username': username,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final user = User.fromJson(response.data['user'] ?? response.data);
        await SecureStorage.saveUser(user);
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data?['message'] ?? 'Login failed',
        );
        return false;
      }
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<bool> register({
    required String username,
    required String password,
    String? email,
    String? phone,
    String? firstName,
    String? lastName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        _apiClient.endpoints.register,
        data: {
          'username': username,
          'password': password,
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final user = User.fromJson(response.data['user'] ?? response.data);
        await SecureStorage.saveUser(user);
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data?['message'] ?? 'Registration failed',
        );
        return false;
      }
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(_apiClient.endpoints.logout);
    } catch (_) {}
    await _clearAuth();
  }

  Future<void> _clearAuth() async {
    await SecureStorage.clearUser();
    await _apiClient.clearCookies();
    state = const AuthState(
      status: AuthStatus.unauthenticated,
      isLoading: false,
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});
