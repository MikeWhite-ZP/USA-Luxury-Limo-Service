import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:usa_luxury_limo/core/constants/app_constants.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/core/theme/app_typography.dart';
import 'package:usa_luxury_limo/core/maps/map_provider.dart';
import 'package:usa_luxury_limo/features/auth/presentation/providers/auth_provider.dart';
import 'package:usa_luxury_limo/features/home/presentation/widgets/location_input_card.dart';
import 'package:usa_luxury_limo/features/home/presentation/widgets/place_search_sheet.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_button.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _pickupController = TextEditingController();
  final _dropoffController = TextEditingController();
  
  double _pickupLat = AppConstants.defaultLatitude;
  double _pickupLng = AppConstants.defaultLongitude;
  double _dropoffLat = 0;
  double _dropoffLng = 0;
  
  List<MapMarker> _markers = [];

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
    super.dispose();
  }

  void _updateMarkers() {
    final markers = <MapMarker>[];
    
    if (_pickupController.text.isNotEmpty && _pickupLat != 0) {
      markers.add(SimpleMapMarker(
        id: 'pickup',
        latitude: _pickupLat,
        longitude: _pickupLng,
        title: 'Pickup',
        color: AppColors.gold,
      ));
    }
    
    if (_dropoffController.text.isNotEmpty && _dropoffLat != 0) {
      markers.add(SimpleMapMarker(
        id: 'dropoff',
        latitude: _dropoffLat,
        longitude: _dropoffLng,
        title: 'Dropoff',
        color: AppColors.success,
      ));
    }
    
    setState(() => _markers = markers);
  }

  Future<void> _showPlaceSearch({required bool isPickup}) async {
    final mapProvider = ref.read(mapProviderProvider);
    
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PlaceSearchSheet(
        mapProvider: mapProvider,
        title: isPickup ? 'Pickup Location' : 'Dropoff Location',
      ),
    );
    
    if (result != null && mounted) {
      setState(() {
        if (isPickup) {
          _pickupController.text = result['address'] ?? result['description'] ?? '';
          _pickupLat = result['latitude'] ?? _pickupLat;
          _pickupLng = result['longitude'] ?? _pickupLng;
        } else {
          _dropoffController.text = result['address'] ?? result['description'] ?? '';
          _dropoffLat = result['latitude'] ?? 0;
          _dropoffLng = result['longitude'] ?? 0;
        }
      });
      _updateMarkers();
    }
  }

  void _proceedToVehicleSelection() {
    if (_pickupController.text.isEmpty || _dropoffController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter pickup and dropoff locations'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    context.push('/vehicle-selection', extra: {
      'pickupAddress': _pickupController.text,
      'dropoffAddress': _dropoffController.text,
      'pickupLat': _pickupLat,
      'pickupLng': _pickupLng,
      'dropoffLat': _dropoffLat,
      'dropoffLng': _dropoffLng,
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final mapProvider = ref.watch(mapProviderProvider);
    final mapType = ref.watch(activeMapProviderTypeProvider);

    return Scaffold(
      body: Stack(
        children: [
          mapProvider.buildMap(
            initialPosition: SimpleMapPosition(
              latitude: _pickupLat,
              longitude: _pickupLng,
              zoom: AppConstants.defaultMapZoom,
            ),
            markers: _markers,
            myLocationEnabled: true,
            onTap: (lat, lng) async {
              final result = await mapProvider.reverseGeocode(lat, lng);
              if (result != null && mounted) {
                setState(() {
                  if (_pickupController.text.isEmpty) {
                    _pickupController.text = result['address'] ?? '';
                    _pickupLat = lat;
                    _pickupLng = lng;
                  } else if (_dropoffController.text.isEmpty) {
                    _dropoffController.text = result['address'] ?? '';
                    _dropoffLat = lat;
                    _dropoffLng = lng;
                  }
                });
                _updateMarkers();
              }
            },
          ),
          
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: AppColors.gold,
                              child: Text(
                                user?.initials ?? 'U',
                                style: const TextStyle(
                                  color: AppColors.backgroundDark,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hello, ${user?.firstName ?? 'Guest'}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                                Text(
                                  'Where to?',
                                  style: AppTypography.displayFont(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.surface.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              mapType == MapProviderType.tomtom 
                                  ? Icons.map 
                                  : Icons.map_outlined,
                              size: 16,
                              color: AppColors.gold,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              mapType == MapProviderType.tomtom ? 'TomTom' : 'Google',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.divider,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    LocationInputCard(
                      pickupController: _pickupController,
                      dropoffController: _dropoffController,
                      onPickupTap: () => _showPlaceSearch(isPickup: true),
                      onDropoffTap: () => _showPlaceSearch(isPickup: false),
                    ),
                    const SizedBox(height: 24),
                    
                    LuxuryButton(
                      text: 'Select Vehicle',
                      onPressed: _proceedToVehicleSelection,
                      icon: Icons.arrow_forward,
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
