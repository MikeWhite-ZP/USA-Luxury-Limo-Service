import 'package:usa_luxury_limo/core/maps/map_provider.dart';
import 'package:usa_luxury_limo/core/constants/tenant_config.dart';

class MapConfig {
  final String? tomtomApiKey;

  const MapConfig({
    this.tomtomApiKey,
  });

  factory MapConfig.fromEnvironment() {
    final tomtomKey = TenantConfig.tomtomApiKey;
    
    return MapConfig(
      tomtomApiKey: tomtomKey.isNotEmpty ? tomtomKey : null,
    );
  }

  bool get hasTomTom => tomtomApiKey != null && tomtomApiKey!.isNotEmpty;
  bool get hasAnyProvider => hasTomTom;

  MapProviderType get activeProvider => MapProviderType.tomtom;
}
