import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/core/utils/extensions.dart';
import 'package:usa_luxury_limo/features/booking/presentation/providers/booking_provider.dart';
import 'package:usa_luxury_limo/shared/models/vehicle_model.dart';
import 'package:usa_luxury_limo/shared/widgets/error_view.dart';
import 'package:usa_luxury_limo/shared/widgets/loading_overlay.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_button.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_card.dart';

class VehicleSelectionScreen extends ConsumerWidget {
  final Map<String, dynamic>? bookingData;

  const VehicleSelectionScreen({super.key, this.bookingData});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(vehiclesProvider);
    final selectedVehicle = ref.watch(selectedVehicleProvider);
    final priceState = ref.watch(priceCalculationProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => context.pop(),
        ),
        title: const Text('Select Vehicle'),
      ),
      body: vehiclesAsync.when(
        loading: () => const Center(child: LuxuryLoader()),
        error: (error, _) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.refresh(vehiclesProvider),
        ),
        data: (vehicles) => Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: vehicles.length,
                itemBuilder: (context, index) {
                  final vehicle = vehicles[index];
                  final isSelected = selectedVehicle?.id == vehicle.id;
                  
                  return _VehicleCard(
                    vehicle: vehicle,
                    isSelected: isSelected,
                    onTap: () {
                      ref.read(selectedVehicleProvider.notifier).state = vehicle;
                      if (bookingData != null) {
                        ref.read(priceCalculationProvider.notifier).calculatePrice(
                          pickupAddress: bookingData!['pickupAddress'] as String,
                          dropoffAddress: bookingData!['dropoffAddress'] as String,
                          vehicleTypeId: vehicle.id,
                        );
                      }
                    },
                  );
                },
              ),
            ),
            
            if (selectedVehicle != null)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Column(
                    children: [
                      if (priceState.estimatedPrice != null) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Estimated Price',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              priceState.estimatedPrice!.formattedCurrency,
                              style: const TextStyle(
                                fontFamily: 'Playfair',
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.gold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                      ],
                      LuxuryButton(
                        text: 'Continue',
                        onPressed: () {
                          context.push('/booking-confirmation', extra: {
                            ...?bookingData,
                            'vehicle': selectedVehicle.toJson(),
                            'estimatedPrice': priceState.estimatedPrice,
                            'distance': priceState.distance,
                            'duration': priceState.duration,
                          });
                        },
                        isLoading: priceState.isLoading,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _VehicleCard extends StatelessWidget {
  final VehicleModel vehicle;
  final bool isSelected;
  final VoidCallback onTap;

  const _VehicleCard({
    required this.vehicle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: LuxuryCard(
        onTap: onTap,
        showGoldBorder: isSelected,
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (vehicle.imageUrl != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: CachedNetworkImage(
                  imageUrl: vehicle.imageUrl!,
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 160,
                    color: AppColors.surfaceLight,
                    child: const Center(child: LuxuryLoader(size: 30)),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 160,
                    color: AppColors.surfaceLight,
                    child: const Icon(
                      Icons.directions_car,
                      size: 60,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        vehicle.name,
                        style: const TextStyle(
                          fontFamily: 'Playfair',
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (isSelected)
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: AppColors.gold,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            size: 16,
                            color: AppColors.backgroundDark,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  if (vehicle.description != null)
                    Text(
                      vehicle.description!,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      _InfoChip(
                        icon: Icons.person_outline,
                        label: '${vehicle.passengerCapacity}',
                      ),
                      const SizedBox(width: 12),
                      _InfoChip(
                        icon: Icons.luggage_outlined,
                        label: '${vehicle.luggageCapacity}',
                      ),
                      const Spacer(),
                      Text(
                        'From ${vehicle.basePrice.formattedCurrency}',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.gold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surfaceHighlight,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
