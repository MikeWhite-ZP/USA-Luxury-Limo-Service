import 'package:dio/dio.dart';

sealed class ApiResult<T> {
  const ApiResult();
}

class ApiSuccess<T> extends ApiResult<T> {
  final T data;
  const ApiSuccess(this.data);
}

class ApiError<T> extends ApiResult<T> {
  final String message;
  final int? statusCode;
  final dynamic originalError;

  const ApiError({
    required this.message,
    this.statusCode,
    this.originalError,
  });

  factory ApiError.fromDioException(DioException error) {
    String message;
    int? statusCode = error.response?.statusCode;

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'Connection timed out. Please try again.';
        break;
      case DioExceptionType.connectionError:
        message = 'No internet connection. Please check your network.';
        break;
      case DioExceptionType.badResponse:
        message = _parseErrorMessage(error.response);
        break;
      case DioExceptionType.cancel:
        message = 'Request was cancelled.';
        break;
      default:
        message = 'Something went wrong. Please try again.';
    }

    return ApiError(
      message: message,
      statusCode: statusCode,
      originalError: error,
    );
  }

  static String _parseErrorMessage(Response? response) {
    if (response?.data == null) {
      return 'An error occurred';
    }

    final data = response!.data;
    if (data is Map<String, dynamic>) {
      return data['message'] ?? data['error'] ?? 'An error occurred';
    }

    return 'An error occurred';
  }
}

class ApiLoading<T> extends ApiResult<T> {
  const ApiLoading();
}

extension ApiResultExtension<T> on ApiResult<T> {
  R when<R>({
    required R Function(T data) success,
    required R Function(String message, int? statusCode) error,
    required R Function() loading,
  }) {
    return switch (this) {
      ApiSuccess<T>(:final data) => success(data),
      ApiError<T>(:final message, :final statusCode) => error(message, statusCode),
      ApiLoading<T>() => loading(),
    };
  }

  T? get dataOrNull => switch (this) {
        ApiSuccess<T>(:final data) => data,
        _ => null,
      };

  String? get errorMessage => switch (this) {
        ApiError<T>(:final message) => message,
        _ => null,
      };

  bool get isSuccess => this is ApiSuccess<T>;
  bool get isError => this is ApiError<T>;
  bool get isLoading => this is ApiLoading<T>;
}
