import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import '../config/app_config.dart';
import 'api_endpoints.dart';

class ApiClient {
  late final Dio _dio;
  late final CookieJar _cookieJar;
  late final ApiEndpoints endpoints;

  static ApiClient? _instance;

  factory ApiClient() {
    _instance ??= ApiClient._internal();
    return _instance!;
  }

  ApiClient._internal() {
    _cookieJar = CookieJar();
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) => status != null && status < 500,
    ));

    _dio.interceptors.add(CookieManager(_cookieJar));
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (o) => print('[API] $o'),
    ));

    endpoints = ApiEndpoints(AppConfig.apiBaseUrl);
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> clearCookies() async {
    await _cookieJar.deleteAll();
  }

  Exception _handleError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException('Connection timeout. Please try again.');
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 0;
        final message = _extractErrorMessage(e.response);
        if (statusCode == 401) {
          return UnauthorizedException(message);
        } else if (statusCode == 403) {
          return ForbiddenException(message);
        } else if (statusCode == 404) {
          return NotFoundException(message);
        } else if (statusCode == 422) {
          return ValidationException(message);
        }
        return ApiException(message);
      case DioExceptionType.cancel:
        return ApiException('Request cancelled.');
      case DioExceptionType.connectionError:
        return ApiException('No internet connection.');
      default:
        return ApiException('Something went wrong. Please try again.');
    }
  }

  String _extractErrorMessage(Response? response) {
    if (response?.data is Map) {
      return response?.data['message'] ?? 
             response?.data['error'] ?? 
             'An error occurred';
    }
    return 'An error occurred';
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class UnauthorizedException extends ApiException {
  UnauthorizedException([String? message]) : super(message ?? 'Unauthorized');
}

class ForbiddenException extends ApiException {
  ForbiddenException([String? message]) : super(message ?? 'Access denied');
}

class NotFoundException extends ApiException {
  NotFoundException([String? message]) : super(message ?? 'Not found');
}

class ValidationException extends ApiException {
  ValidationException([String? message]) : super(message ?? 'Validation error');
}
