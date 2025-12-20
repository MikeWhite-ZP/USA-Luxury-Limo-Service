import 'dart:async';
import 'package:flutter/material.dart';
import 'package:usa_luxury_limo/core/maps/map_provider.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_text_field.dart';

class PlaceSearchSheet extends StatefulWidget {
  final MapProvider mapProvider;
  final String title;

  const PlaceSearchSheet({
    super.key,
    required this.mapProvider,
    required this.title,
  });

  @override
  State<PlaceSearchSheet> createState() => _PlaceSearchSheetState();
}

class _PlaceSearchSheetState extends State<PlaceSearchSheet> {
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> _results = [];
  bool _isLoading = false;
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (query.length >= 3) {
        _searchPlaces(query);
      } else {
        setState(() => _results = []);
      }
    });
  }

  Future<void> _searchPlaces(String query) async {
    setState(() => _isLoading = true);
    
    final results = await widget.mapProvider.searchPlaces(query);
    
    if (mounted) {
      setState(() {
        _results = results;
        _isLoading = false;
      });
    }
  }

  void _selectPlace(Map<String, dynamic> place) {
    final lat = place['latitude'];
    final lng = place['longitude'];
    
    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not get location coordinates. Please try another address.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    Navigator.pop(context, {
      'address': place['description'] ?? place['mainText'] ?? '',
      'latitude': lat,
      'longitude': lng,
      'placeId': place['placeId'],
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.divider,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      widget.title,
                      style: const TextStyle(
                        fontFamily: 'Playfair',
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                LuxuryTextField(
                  controller: _searchController,
                  hint: 'Search for a location',
                  prefixIcon: Icons.search,
                  autofocus: true,
                  onChanged: _onSearchChanged,
                  suffixIcon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.gold,
                          ),
                        )
                      : null,
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.divider, height: 1),
          Expanded(
            child: _results.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.search,
                          size: 48,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Search for an address',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _results.length,
                    separatorBuilder: (_, __) => const Divider(
                      color: AppColors.divider,
                      height: 1,
                      indent: 72,
                    ),
                    itemBuilder: (context, index) {
                      final place = _results[index];
                      return ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.location_on_outlined,
                            color: AppColors.gold,
                          ),
                        ),
                        title: Text(
                          place['mainText'] ?? place['description'] ?? '',
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          place['secondaryText'] ?? '',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onTap: () => _selectPlace(place),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
