import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../config/tenant_config.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';

class TenantState {
  final TenantConfig? config;
  final bool isLoading;
  final String? error;

  const TenantState({
    this.config,
    this.isLoading = false,
    this.error,
  });

  TenantState copyWith({
    TenantConfig? config,
    bool? isLoading,
    String? error,
  }) {
    return TenantState(
      config: config ?? this.config,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class TenantNotifier extends StateNotifier<TenantState> {
  final ApiClient _apiClient;

  TenantNotifier(this._apiClient) : super(const TenantState());

  Future<void> loadTenantConfig() async {
    state = state.copyWith(isLoading: true);

    try {
      final cachedConfig = await SecureStorage.getTenantConfig();
      if (cachedConfig != null) {
        state = TenantState(config: cachedConfig, isLoading: true);
      }

      final response = await _apiClient.get(_apiClient.endpoints.branding);

      if (response.statusCode == 200 && response.data != null) {
        final config = TenantConfig.fromJson({
          ...response.data,
          'slug': AppConfig.tenantSlug,
          'apiBaseUrl': AppConfig.apiBaseUrl,
        });
        
        await SecureStorage.saveTenantConfig(config);
        state = TenantState(config: config, isLoading: false);
      } else {
        if (state.config == null) {
          state = TenantState(
            config: TenantConfig.defaultConfig(AppConfig.apiBaseUrl),
            isLoading: false,
          );
        } else {
          state = state.copyWith(isLoading: false);
        }
      }
    } catch (e) {
      if (state.config == null) {
        state = TenantState(
          config: TenantConfig.defaultConfig(AppConfig.apiBaseUrl),
          isLoading: false,
          error: e.toString(),
        );
      } else {
        state = state.copyWith(isLoading: false, error: e.toString());
      }
    }
  }

  Future<void> refreshBranding() async {
    await loadTenantConfig();
  }
}

final tenantProvider = StateNotifierProvider<TenantNotifier, TenantState>((ref) {
  final apiClient = ApiClient();
  return TenantNotifier(apiClient);
});

final tenantConfigProvider = Provider<TenantConfig?>((ref) {
  return ref.watch(tenantProvider).config;
});

final companyNameProvider = Provider<String>((ref) {
  return ref.watch(tenantConfigProvider)?.name ?? 'USA Luxury Limo';
});

final logoUrlProvider = Provider<String?>((ref) {
  return ref.watch(tenantConfigProvider)?.logoUrl;
});
