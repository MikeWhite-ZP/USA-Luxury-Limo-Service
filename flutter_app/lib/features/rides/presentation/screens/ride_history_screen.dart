import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/core/theme/app_typography.dart';
import 'package:usa_luxury_limo/core/utils/extensions.dart';
import 'package:usa_luxury_limo/features/rides/presentation/providers/rides_provider.dart';
import 'package:usa_luxury_limo/shared/models/booking_model.dart';
import 'package:usa_luxury_limo/shared/widgets/error_view.dart';
import 'package:usa_luxury_limo/shared/widgets/loading_overlay.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_card.dart';

class RideHistoryScreen extends ConsumerStatefulWidget {
  const RideHistoryScreen({super.key});

  @override
  ConsumerState<RideHistoryScreen> createState() => _RideHistoryScreenState();
}

class _RideHistoryScreenState extends ConsumerState<RideHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Rides'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.gold,
          labelColor: AppColors.gold,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _UpcomingRidesTab(),
          _PastRidesTab(),
        ],
      ),
    );
  }
}

class _UpcomingRidesTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ridesAsync = ref.watch(upcomingRidesProvider);

    return ridesAsync.when(
      loading: () => const Center(child: LuxuryLoader()),
      error: (error, _) => ErrorView(
        message: error.toString(),
        onRetry: () => ref.refresh(upcomingRidesProvider),
      ),
      data: (rides) {
        if (rides.isEmpty) {
          return const EmptyView(
            title: 'No Upcoming Rides',
            message: 'Book your next luxury ride now',
            icon: Icons.directions_car_outlined,
          );
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(upcomingRidesProvider.future),
          color: AppColors.gold,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: rides.length,
            itemBuilder: (context, index) => _RideCard(ride: rides[index]),
          ),
        );
      },
    );
  }
}

class _PastRidesTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ridesAsync = ref.watch(pastRidesProvider);

    return ridesAsync.when(
      loading: () => const Center(child: LuxuryLoader()),
      error: (error, _) => ErrorView(
        message: error.toString(),
        onRetry: () => ref.refresh(pastRidesProvider),
      ),
      data: (rides) {
        if (rides.isEmpty) {
          return const EmptyView(
            title: 'No Past Rides',
            message: 'Your completed rides will appear here',
            icon: Icons.history,
          );
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(pastRidesProvider.future),
          color: AppColors.gold,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: rides.length,
            itemBuilder: (context, index) => _RideCard(ride: rides[index]),
          ),
        );
      },
    );
  }
}

class _RideCard extends StatelessWidget {
  final BookingModel ride;

  const _RideCard({required this.ride});

  Color get _statusColor {
    switch (ride.status) {
      case BookingStatus.pending:
        return AppColors.warning;
      case BookingStatus.confirmed:
        return AppColors.info;
      case BookingStatus.assigned:
        return AppColors.gold;
      case BookingStatus.inProgress:
        return AppColors.gold;
      case BookingStatus.completed:
        return AppColors.success;
      case BookingStatus.cancelled:
        return AppColors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: LuxuryCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  ride.scheduledDate.relativeDate,
                  style: AppTypography.displayFont(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    ride.status.displayName,
                    style: TextStyle(
                      color: _statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              ride.scheduledDate.formattedTime,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(color: AppColors.divider),
            const SizedBox(height: 16),
            Row(
              children: [
                Column(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppColors.gold,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.goldLight, width: 2),
                      ),
                    ),
                    Container(
                      width: 2,
                      height: 30,
                      color: AppColors.divider,
                    ),
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.successLight, width: 2),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ride.pickup.address,
                        style: const TextStyle(fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        ride.dropoff.address,
                        style: const TextStyle(fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: AppColors.divider),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (ride.vehicle != null)
                  Row(
                    children: [
                      const Icon(
                        Icons.directions_car,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ride.vehicle!.name,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                Text(
                  ride.displayPrice.formattedCurrency,
                  style: AppTypography.displayFont(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
