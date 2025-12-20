import 'package:usa_luxury_limo/core/maps/map_provider.dart';

class MapConfig {
  final String? googleMapsApiKey;
  final String? tomtomApiKey;
  final MapProviderType preferredProvider;

  const MapConfig({
    this.googleMapsApiKey,
    this.tomtomApiKey,
    this.preferredProvider = MapProviderType.tomtom,
  });

  factory MapConfig.fromEnvironment() {
    const googleKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');
    const tomtomKey = String.fromEnvironment('TOMTOM_API_KEY');
    const preferred = String.fromEnvironment('PREFERRED_MAP_PROVIDER', defaultValue: 'tomtom');
    
    return MapConfig(
      googleMapsApiKey: googleKey.isNotEmpty ? googleKey : null,
      tomtomApiKey: tomtomKey.isNotEmpty ? tomtomKey : null,
      preferredProvider: preferred == 'google' 
          ? MapProviderType.google 
          : MapProviderType.tomtom,
    );
  }

  bool get hasGoogleMaps => googleMapsApiKey != null && googleMapsApiKey!.isNotEmpty;
  bool get hasTomTom => tomtomApiKey != null && tomtomApiKey!.isNotEmpty;
  bool get hasAnyProvider => hasGoogleMaps || hasTomTom;

  MapProviderType get activeProvider {
    if (preferredProvider == MapProviderType.tomtom && hasTomTom) {
      return MapProviderType.tomtom;
    }
    if (preferredProvider == MapProviderType.google && hasGoogleMaps) {
      return MapProviderType.google;
    }
    if (hasTomTom) return MapProviderType.tomtom;
    if (hasGoogleMaps) return MapProviderType.google;
    return MapProviderType.tomtom;
  }
}
