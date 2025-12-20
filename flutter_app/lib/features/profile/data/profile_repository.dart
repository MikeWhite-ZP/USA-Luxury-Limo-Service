import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/constants/api_constants.dart';
import 'package:usa_luxury_limo/core/network/api_client.dart';
import 'package:usa_luxury_limo/core/network/api_result.dart';
import 'package:usa_luxury_limo/shared/models/user_model.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(apiClientProvider));
});

class ProfileRepository {
  final ApiClient _apiClient;

  ProfileRepository(this._apiClient);

  Future<ApiResult<UserModel>> getProfile() async {
    try {
      final response = await _apiClient.get(ApiConstants.profile);
      final user = UserModel.fromJson(response.data as Map<String, dynamic>);
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to load profile: $e');
    }
  }

  Future<ApiResult<UserModel>> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    try {
      final response = await _apiClient.patch(
        ApiConstants.updateProfile,
        data: {
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (phone != null) 'phone': phone,
        },
      );
      final user = UserModel.fromJson(response.data as Map<String, dynamic>);
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to update profile: $e');
    }
  }

  Future<ApiResult<String>> uploadProfileImage(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(filePath),
      });
      
      final response = await _apiClient.uploadFile(
        ApiConstants.uploadProfileImage,
        data: formData,
      );
      
      final imageUrl = (response.data as Map<String, dynamic>)['imageUrl'] as String;
      return ApiSuccess(imageUrl);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to upload image: $e');
    }
  }
}
