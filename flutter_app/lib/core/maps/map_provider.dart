import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:usa_luxury_limo/core/maps/map_config.dart';
import 'package:usa_luxury_limo/core/maps/google_maps_provider.dart';
import 'package:usa_luxury_limo/core/maps/tomtom_maps_provider.dart';

enum MapProviderType { google, tomtom }

abstract class MapPosition {
  double get latitude;
  double get longitude;
  double get zoom;
}

class SimpleMapPosition implements MapPosition {
  @override
  final double latitude;
  @override
  final double longitude;
  @override
  final double zoom;

  const SimpleMapPosition({
    required this.latitude,
    required this.longitude,
    this.zoom = 15.0,
  });
}

abstract class MapMarker {
  String get id;
  double get latitude;
  double get longitude;
  String? get title;
  Color? get color;
}

class SimpleMapMarker implements MapMarker {
  @override
  final String id;
  @override
  final double latitude;
  @override
  final double longitude;
  @override
  final String? title;
  @override
  final Color? color;

  const SimpleMapMarker({
    required this.id,
    required this.latitude,
    required this.longitude,
    this.title,
    this.color,
  });
}

abstract class MapProvider {
  MapProviderType get type;
  
  Widget buildMap({
    required MapPosition initialPosition,
    List<MapMarker> markers = const [],
    bool myLocationEnabled = true,
    bool zoomControlsEnabled = false,
    void Function(double lat, double lng)? onTap,
    void Function(dynamic controller)? onMapCreated,
    String? darkModeStyle,
  });
  
  Future<List<Map<String, dynamic>>> searchPlaces(String query);
  
  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lng);
  
  Future<Map<String, dynamic>?> getRoute({
    required double originLat,
    required double originLng,
    required double destLat,
    required double destLng,
  });
}

final mapConfigProvider = Provider<MapConfig>((ref) {
  return MapConfig.fromEnvironment();
});

final mapProviderProvider = Provider<MapProvider>((ref) {
  final config = ref.watch(mapConfigProvider);
  
  if (config.preferredProvider == MapProviderType.tomtom && 
      config.tomtomApiKey != null) {
    return TomTomMapsProvider(apiKey: config.tomtomApiKey!);
  }
  
  if (config.googleMapsApiKey != null) {
    return GoogleMapsProvider(apiKey: config.googleMapsApiKey!);
  }
  
  if (config.tomtomApiKey != null) {
    return TomTomMapsProvider(apiKey: config.tomtomApiKey!);
  }
  
  return TomTomMapsProvider(apiKey: '');
});

final activeMapProviderTypeProvider = Provider<MapProviderType>((ref) {
  return ref.watch(mapProviderProvider).type;
});
