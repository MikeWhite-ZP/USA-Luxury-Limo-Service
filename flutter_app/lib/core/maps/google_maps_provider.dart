import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gm;
import 'package:dio/dio.dart';
import 'package:usa_luxury_limo/core/maps/map_provider.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';

class GoogleMapsProvider implements MapProvider {
  final String apiKey;
  final Dio _dio = Dio();

  GoogleMapsProvider({required this.apiKey});

  @override
  MapProviderType get type => MapProviderType.google;

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
    final googleMarkers = markers.map((m) {
      return gm.Marker(
        markerId: gm.MarkerId(m.id),
        position: gm.LatLng(m.latitude, m.longitude),
        infoWindow: m.title != null ? gm.InfoWindow(title: m.title) : gm.InfoWindow.noText,
        icon: m.color != null
            ? gm.BitmapDescriptor.defaultMarkerWithHue(
                _colorToHue(m.color!),
              )
            : gm.BitmapDescriptor.defaultMarker,
      );
    }).toSet();

    return gm.GoogleMap(
      initialCameraPosition: gm.CameraPosition(
        target: gm.LatLng(initialPosition.latitude, initialPosition.longitude),
        zoom: initialPosition.zoom,
      ),
      markers: googleMarkers,
      myLocationEnabled: myLocationEnabled,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: zoomControlsEnabled,
      mapToolbarEnabled: false,
      onMapCreated: (controller) {
        if (darkModeStyle != null) {
          controller.setMapStyle(darkModeStyle);
        } else {
          controller.setMapStyle(_defaultDarkStyle);
        }
        onMapCreated?.call(controller);
      },
      onTap: onTap != null 
          ? (latLng) => onTap(latLng.latitude, latLng.longitude) 
          : null,
    );
  }

  double _colorToHue(Color color) {
    if (color == AppColors.gold) return gm.BitmapDescriptor.hueYellow;
    if (color == AppColors.success) return gm.BitmapDescriptor.hueGreen;
    if (color == AppColors.error) return gm.BitmapDescriptor.hueRed;
    return gm.BitmapDescriptor.hueRed;
  }

  @override
  Future<List<Map<String, dynamic>>> searchPlaces(String query) async {
    try {
      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        queryParameters: {
          'input': query,
          'key': apiKey,
        },
      );

      final predictions = response.data['predictions'] as List;
      return predictions.map((p) {
        return {
          'placeId': p['place_id'],
          'description': p['description'],
          'mainText': p['structured_formatting']?['main_text'],
          'secondaryText': p['structured_formatting']?['secondary_text'],
        };
      }).toList();
    } catch (e) {
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lng) async {
    try {
      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        queryParameters: {
          'latlng': '$lat,$lng',
          'key': apiKey,
        },
      );

      final results = response.data['results'] as List;
      if (results.isNotEmpty) {
        return {
          'address': results[0]['formatted_address'],
          'latitude': lat,
          'longitude': lng,
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
    try {
      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        queryParameters: {
          'origin': '$originLat,$originLng',
          'destination': '$destLat,$destLng',
          'key': apiKey,
        },
      );

      final routes = response.data['routes'] as List;
      if (routes.isNotEmpty) {
        final route = routes[0];
        final leg = route['legs'][0];
        return {
          'distance': leg['distance']['value'] / 1609.34,
          'duration': leg['duration']['value'] ~/ 60,
          'polyline': route['overview_polyline']['points'],
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static const String _defaultDarkStyle = '''
  [
    {"elementType": "geometry", "stylers": [{"color": "#1d1d1d"}]},
    {"elementType": "labels.text.fill", "stylers": [{"color": "#8ec3b9"}]},
    {"elementType": "labels.text.stroke", "stylers": [{"color": "#1a3646"}]},
    {"featureType": "road", "elementType": "geometry", "stylers": [{"color": "#2c2c2c"}]},
    {"featureType": "road", "elementType": "geometry.stroke", "stylers": [{"color": "#1f1f1f"}]},
    {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#0e1626"}]},
    {"featureType": "poi", "elementType": "labels", "stylers": [{"visibility": "off"}]}
  ]
  ''';
}
