import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/constants/api_constants.dart';
import 'package:usa_luxury_limo/core/network/api_client.dart';
import 'package:usa_luxury_limo/core/network/api_result.dart';
import 'package:usa_luxury_limo/core/network/token_storage.dart';
import 'package:usa_luxury_limo/shared/models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStorageProvider),
  );
});

class AuthRepository {
  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  AuthRepository(this._apiClient, this._tokenStorage);

  Future<ApiResult<UserModel>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data as Map<String, dynamic>;
      
      if (data['token'] != null) {
        await _tokenStorage.saveAccessToken(data['token'] as String);
      }
      if (data['refreshToken'] != null) {
        await _tokenStorage.saveRefreshToken(data['refreshToken'] as String);
      }

      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'An unexpected error occurred: $e');
    }
  }

  Future<ApiResult<UserModel>> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.register,
        data: {
          'email': email,
          'password': password,
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (phone != null) 'phone': phone,
        },
      );

      final data = response.data as Map<String, dynamic>;
      
      if (data['token'] != null) {
        await _tokenStorage.saveAccessToken(data['token'] as String);
      }
      if (data['refreshToken'] != null) {
        await _tokenStorage.saveRefreshToken(data['refreshToken'] as String);
      }

      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'An unexpected error occurred: $e');
    }
  }

  Future<ApiResult<UserModel>> getCurrentUser() async {
    try {
      final response = await _apiClient.get(ApiConstants.user);
      final user = UserModel.fromJson(response.data as Map<String, dynamic>);
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'An unexpected error occurred: $e');
    }
  }

  Future<ApiResult<void>> logout() async {
    try {
      await _apiClient.post(ApiConstants.logout);
      await _tokenStorage.clearTokens();
      return const ApiSuccess(null);
    } on DioException catch (e) {
      await _tokenStorage.clearTokens();
      return ApiError.fromDioException(e);
    } catch (e) {
      await _tokenStorage.clearTokens();
      return ApiError(message: 'An unexpected error occurred: $e');
    }
  }

  Future<ApiResult<void>> forgotPassword(String email) async {
    try {
      await _apiClient.post(
        ApiConstants.forgotPassword,
        data: {'email': email},
      );
      return const ApiSuccess(null);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'An unexpected error occurred: $e');
    }
  }

  Future<bool> isLoggedIn() async {
    return await _tokenStorage.hasValidToken();
  }
}
