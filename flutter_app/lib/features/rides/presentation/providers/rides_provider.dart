import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/features/rides/data/rides_repository.dart';
import 'package:usa_luxury_limo/shared/models/booking_model.dart';

final upcomingRidesProvider = FutureProvider<List<BookingModel>>((ref) async {
  final repository = ref.watch(ridesRepositoryProvider);
  return repository.getUpcomingRides();
});

final pastRidesProvider = FutureProvider<List<BookingModel>>((ref) async {
  final repository = ref.watch(ridesRepositoryProvider);
  return repository.getPastRides();
});
