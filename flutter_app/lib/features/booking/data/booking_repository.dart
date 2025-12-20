import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/constants/api_constants.dart';
import 'package:usa_luxury_limo/core/network/api_client.dart';
import 'package:usa_luxury_limo/core/network/api_result.dart';
import 'package:usa_luxury_limo/shared/models/booking_model.dart';
import 'package:usa_luxury_limo/shared/models/vehicle_model.dart';

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  return BookingRepository(ref.watch(apiClientProvider));
});

class BookingRepository {
  final ApiClient _apiClient;

  BookingRepository(this._apiClient);

  Future<ApiResult<List<VehicleModel>>> getAvailableVehicles() async {
    try {
      final response = await _apiClient.get(ApiConstants.availableVehicles);
      final data = response.data as List;
      final vehicles = data
          .map((e) => VehicleModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiSuccess(vehicles);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to load vehicles: $e');
    }
  }

  Future<ApiResult<Map<String, dynamic>>> calculatePrice({
    required String pickupAddress,
    required String dropoffAddress,
    required String vehicleTypeId,
    int passengers = 1,
    int luggage = 0,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.calculatePrice,
        data: {
          'pickupAddress': pickupAddress,
          'dropoffAddress': dropoffAddress,
          'vehicleTypeId': vehicleTypeId,
          'passengers': passengers,
          'luggage': luggage,
        },
      );
      return ApiSuccess(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to calculate price: $e');
    }
  }

  Future<ApiResult<BookingModel>> createBooking({
    required String pickupAddress,
    required String dropoffAddress,
    required DateTime scheduledDate,
    required String vehicleTypeId,
    int passengers = 1,
    int luggage = 0,
    String? notes,
    String? flightNumber,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.bookings,
        data: {
          'pickupAddress': pickupAddress,
          'dropoffAddress': dropoffAddress,
          'scheduledDate': scheduledDate.toIso8601String(),
          'vehicleTypeId': vehicleTypeId,
          'passengers': passengers,
          'luggage': luggage,
          if (notes != null) 'notes': notes,
          if (flightNumber != null) 'flightNumber': flightNumber,
        },
      );
      final booking = BookingModel.fromJson(response.data as Map<String, dynamic>);
      return ApiSuccess(booking);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to create booking: $e');
    }
  }

  Future<ApiResult<List<BookingModel>>> getUserBookings() async {
    try {
      final response = await _apiClient.get(ApiConstants.bookings);
      final data = response.data as List;
      final bookings = data
          .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return ApiSuccess(bookings);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to load bookings: $e');
    }
  }

  Future<ApiResult<BookingModel>> getBookingById(String id) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.bookingById.replaceAll('{id}', id),
      );
      final booking = BookingModel.fromJson(response.data as Map<String, dynamic>);
      return ApiSuccess(booking);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to load booking: $e');
    }
  }

  Future<ApiResult<void>> cancelBooking(String id) async {
    try {
      await _apiClient.patch(
        ApiConstants.bookingById.replaceAll('{id}', id),
        data: {'status': 'cancelled'},
      );
      return const ApiSuccess(null);
    } on DioException catch (e) {
      return ApiError.fromDioException(e);
    } catch (e) {
      return ApiError(message: 'Failed to cancel booking: $e');
    }
  }
}
