import 'package:usa_luxury_limo/core/maps/map_provider.dart';

class MapConfig {
  final String? tomtomApiKey;

  const MapConfig({
    this.tomtomApiKey,
  });

  factory MapConfig.fromEnvironment() {
    const tomtomKey = String.fromEnvironment('TOMTOM_API_KEY');
    
    return MapConfig(
      tomtomApiKey: tomtomKey.isNotEmpty ? tomtomKey : null,
    );
  }

  bool get hasTomTom => tomtomApiKey != null && tomtomApiKey!.isNotEmpty;
  bool get hasAnyProvider => hasTomTom;

  MapProviderType get activeProvider => MapProviderType.tomtom;
}
