import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:usa_luxury_limo/core/constants/app_constants.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/features/auth/presentation/providers/auth_provider.dart';
import 'package:usa_luxury_limo/features/home/presentation/widgets/location_input_card.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_button.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  GoogleMapController? _mapController;
  final _pickupController = TextEditingController();
  final _dropoffController = TextEditingController();
  
  LatLng _currentLocation = const LatLng(
    AppConstants.defaultLatitude,
    AppConstants.defaultLongitude,
  );
  
  Set<Marker> _markers = {};

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    _setMapStyle();
  }

  Future<void> _setMapStyle() async {
    const darkMapStyle = '''
    [
      {"elementType": "geometry", "stylers": [{"color": "#1d1d1d"}]},
      {"elementType": "labels.text.fill", "stylers": [{"color": "#8ec3b9"}]},
      {"elementType": "labels.text.stroke", "stylers": [{"color": "#1a3646"}]},
      {"featureType": "road", "elementType": "geometry", "stylers": [{"color": "#2c2c2c"}]},
      {"featureType": "road", "elementType": "geometry.stroke", "stylers": [{"color": "#1f1f1f"}]},
      {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#0e1626"}]}
    ]
    ''';
    await _mapController?.setMapStyle(darkMapStyle);
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
      'pickupLat': _currentLocation.latitude,
      'pickupLng': _currentLocation.longitude,
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            onMapCreated: _onMapCreated,
            initialCameraPosition: CameraPosition(
              target: _currentLocation,
              zoom: AppConstants.defaultMapZoom,
            ),
            markers: _markers,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
          ),
          
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
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
                                const Text(
                                  'Where to?',
                                  style: TextStyle(
                                    fontFamily: 'Playfair',
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
                      onPickupTap: () {},
                      onDropoffTap: () {},
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
