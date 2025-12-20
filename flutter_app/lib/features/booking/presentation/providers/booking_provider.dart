import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/network/api_result.dart';
import 'package:usa_luxury_limo/features/booking/data/booking_repository.dart';
import 'package:usa_luxury_limo/shared/models/vehicle_model.dart';

final vehiclesProvider = FutureProvider<List<VehicleModel>>((ref) async {
  final repository = ref.watch(bookingRepositoryProvider);
  final result = await repository.getAvailableVehicles();
  
  return result.when(
    success: (vehicles) => vehicles,
    error: (message, _) => throw Exception(message),
    loading: () => [],
  );
});

final selectedVehicleProvider = StateProvider<VehicleModel?>((ref) => null);

class PriceCalculationState {
  final bool isLoading;
  final double? estimatedPrice;
  final double? distance;
  final int? duration;
  final String? errorMessage;

  const PriceCalculationState({
    this.isLoading = false,
    this.estimatedPrice,
    this.distance,
    this.duration,
    this.errorMessage,
  });

  PriceCalculationState copyWith({
    bool? isLoading,
    double? estimatedPrice,
    double? distance,
    int? duration,
    String? errorMessage,
  }) {
    return PriceCalculationState(
      isLoading: isLoading ?? this.isLoading,
      estimatedPrice: estimatedPrice ?? this.estimatedPrice,
      distance: distance ?? this.distance,
      duration: duration ?? this.duration,
      errorMessage: errorMessage,
    );
  }
}

class PriceCalculationNotifier extends StateNotifier<PriceCalculationState> {
  final BookingRepository _repository;

  PriceCalculationNotifier(this._repository) : super(const PriceCalculationState());

  Future<void> calculatePrice({
    required String pickupAddress,
    required String dropoffAddress,
    required String vehicleTypeId,
    int passengers = 1,
    int luggage = 0,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _repository.calculatePrice(
      pickupAddress: pickupAddress,
      dropoffAddress: dropoffAddress,
      vehicleTypeId: vehicleTypeId,
      passengers: passengers,
      luggage: luggage,
    );

    result.when(
      success: (data) {
        state = PriceCalculationState(
          estimatedPrice: (data['estimatedPrice'] as num?)?.toDouble(),
          distance: (data['distance'] as num?)?.toDouble(),
          duration: data['duration'] as int?,
        );
      },
      error: (message, _) {
        state = PriceCalculationState(errorMessage: message);
      },
      loading: () {},
    );
  }

  void reset() {
    state = const PriceCalculationState();
  }
}

final priceCalculationProvider =
    StateNotifierProvider<PriceCalculationNotifier, PriceCalculationState>((ref) {
  return PriceCalculationNotifier(ref.watch(bookingRepositoryProvider));
});
