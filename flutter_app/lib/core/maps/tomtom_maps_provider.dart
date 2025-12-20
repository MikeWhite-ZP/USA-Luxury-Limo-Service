import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:dio/dio.dart';
import 'package:usa_luxury_limo/core/maps/map_provider.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';

class TomTomMapsProvider implements MapProvider {
  final String apiKey;
  final Dio _dio = Dio();

  TomTomMapsProvider({required this.apiKey});

  @override
  MapProviderType get type => MapProviderType.tomtom;

  String get _tileUrl {
    return 'https://api.tomtom.com/map/1/tile/basic/night/{z}/{x}/{y}.png?key=$apiKey';
  }

  @override
  Widget buildMap({
    required MapPosition initialPosition,
    List<MapMarker> markers = const [],
    bool myLocationEnabled = true,
    bool zoomControlsEnabled = false,
    void Function(double lat, double lng)? onTap,
    void Function(dynamic controller)? onMapCreated,
    String? darkModeStyle,
  }) {
    final mapMarkers = markers.map((m) {
      return Marker(
        point: LatLng(m.latitude, m.longitude),
        width: 40,
        height: 40,
        child: _buildMarkerWidget(m.color ?? AppColors.gold, m.title),
      );
    }).toList();

    return FlutterMap(
      options: MapOptions(
        initialCenter: LatLng(initialPosition.latitude, initialPosition.longitude),
        initialZoom: initialPosition.zoom,
        backgroundColor: AppColors.background,
        onTap: onTap != null
            ? (tapPosition, point) => onTap(point.latitude, point.longitude)
            : null,
        onMapReady: () {
          onMapCreated?.call(null);
        },
      ),
      children: [
        TileLayer(
          urlTemplate: _tileUrl,
          userAgentPackageName: 'com.usaluxurylimo.app',
          tileProvider: NetworkTileProvider(),
        ),
        if (mapMarkers.isNotEmpty)
          MarkerLayer(markers: mapMarkers),
      ],
    );
  }

  Widget _buildMarkerWidget(Color color, String? title) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.4),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(
            Icons.location_on,
            color: Colors.white,
            size: 20,
          ),
        ),
      ],
    );
  }

  @override
  Future<List<Map<String, dynamic>>> searchPlaces(String query) async {
    if (apiKey.isEmpty) return [];
    
    try {
      final response = await _dio.get(
        'https://api.tomtom.com/search/2/search/$query.json',
        queryParameters: {
          'key': apiKey,
          'limit': 5,
          'typeahead': true,
        },
      );

      final results = response.data['results'] as List;
      return results.map((r) {
        final address = r['address'] as Map<String, dynamic>;
        final position = r['position'] as Map<String, dynamic>;
        return {
          'placeId': r['id'],
          'description': address['freeformAddress'] ?? '',
          'mainText': r['poi']?['name'] ?? address['streetName'] ?? '',
          'secondaryText': address['municipality'] ?? address['countrySubdivision'] ?? '',
          'latitude': position['lat'],
          'longitude': position['lon'],
        };
      }).toList();
    } catch (e) {
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lng) async {
    if (apiKey.isEmpty) return null;
    
    try {
      final response = await _dio.get(
        'https://api.tomtom.com/search/2/reverseGeocode/$lat,$lng.json',
        queryParameters: {
          'key': apiKey,
        },
      );

      final addresses = response.data['addresses'] as List;
      if (addresses.isNotEmpty) {
        final address = addresses[0]['address'] as Map<String, dynamic>;
        return {
          'address': address['freeformAddress'],
          'latitude': lat,
          'longitude': lng,
          'streetName': address['streetName'],
          'municipality': address['municipality'],
          'country': address['country'],
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<Map<String, dynamic>?> getRoute({
    required double originLat,
    required double originLng,
    required double destLat,
    required double destLng,
  }) async {
    if (apiKey.isEmpty) return null;
    
    try {
      final response = await _dio.get(
        'https://api.tomtom.com/routing/1/calculateRoute/$originLat,$originLng:$destLat,$destLng/json',
        queryParameters: {
          'key': apiKey,
          'traffic': true,
        },
      );

      final routes = response.data['routes'] as List;
      if (routes.isNotEmpty) {
        final route = routes[0];
        final summary = route['summary'];
        return {
          'distance': summary['lengthInMeters'] / 1609.34,
          'duration': summary['travelTimeInSeconds'] ~/ 60,
          'trafficDelay': summary['trafficDelayInSeconds'] ?? 0,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
