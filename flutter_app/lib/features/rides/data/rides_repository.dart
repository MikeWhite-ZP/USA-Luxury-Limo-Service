import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/features/booking/data/booking_repository.dart';
import 'package:usa_luxury_limo/shared/models/booking_model.dart';

final ridesRepositoryProvider = Provider<RidesRepository>((ref) {
  return RidesRepository(ref.watch(bookingRepositoryProvider));
});

class RidesRepository {
  final BookingRepository _bookingRepository;

  RidesRepository(this._bookingRepository);

  Future<List<BookingModel>> getUpcomingRides() async {
    final result = await _bookingRepository.getUserBookings();
    
    return result.when(
      success: (bookings) {
        return bookings
            .where((b) =>
                b.status != BookingStatus.completed &&
                b.status != BookingStatus.cancelled)
            .toList()
          ..sort((a, b) => a.scheduledDate.compareTo(b.scheduledDate));
      },
      error: (_, __) => [],
      loading: () => [],
    );
  }

  Future<List<BookingModel>> getPastRides() async {
    final result = await _bookingRepository.getUserBookings();
    
    return result.when(
      success: (bookings) {
        return bookings
            .where((b) =>
                b.status == BookingStatus.completed ||
                b.status == BookingStatus.cancelled)
            .toList()
          ..sort((a, b) => b.scheduledDate.compareTo(a.scheduledDate));
      },
      error: (_, __) => [],
      loading: () => [],
    );
  }
}
