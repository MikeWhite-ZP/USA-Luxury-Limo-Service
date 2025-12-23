class TenantConfig {
  final String slug;
  final String name;
  final String apiBaseUrl;
  final String? logoUrl;
  final String? faviconUrl;
  final String? tagline;
  final TenantColors lightColors;
  final TenantColors darkColors;

  const TenantConfig({
    required this.slug,
    required this.name,
    required this.apiBaseUrl,
    this.logoUrl,
    this.faviconUrl,
    this.tagline,
    required this.lightColors,
    required this.darkColors,
  });

  factory TenantConfig.fromJson(Map<String, dynamic> json) {
    return TenantConfig(
      slug: json['slug'] ?? 'default',
      name: json['companyName'] ?? 'USA Luxury Limo',
      apiBaseUrl: json['apiBaseUrl'] ?? '',
      logoUrl: json['logoUrl'],
      faviconUrl: json['faviconUrl'],
      tagline: json['tagline'],
      lightColors: TenantColors.fromJson(json['lightColors'] ?? {}),
      darkColors: TenantColors.fromJson(json['darkColors'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() => {
    'slug': slug,
    'companyName': name,
    'apiBaseUrl': apiBaseUrl,
    'logoUrl': logoUrl,
    'faviconUrl': faviconUrl,
    'tagline': tagline,
    'lightColors': lightColors.toJson(),
    'darkColors': darkColors.toJson(),
  };

  static TenantConfig defaultConfig(String apiBaseUrl) => TenantConfig(
    slug: 'default',
    name: 'USA Luxury Limo',
    apiBaseUrl: apiBaseUrl,
    lightColors: TenantColors.defaultLight(),
    darkColors: TenantColors.defaultDark(),
  );
}

class TenantColors {
  final String primary;
  final String secondary;
  final String accent;
  final String background;
  final String foreground;
  final String muted;
  final String mutedForeground;
  final String card;
  final String cardForeground;
  final String border;

  const TenantColors({
    required this.primary,
    required this.secondary,
    required this.accent,
    required this.background,
    required this.foreground,
    required this.muted,
    required this.mutedForeground,
    required this.card,
    required this.cardForeground,
    required this.border,
  });

  factory TenantColors.fromJson(Map<String, dynamic> json) {
    return TenantColors(
      primary: json['primary'] ?? '#2563eb',
      secondary: json['secondary'] ?? '#64748b',
      accent: json['accent'] ?? '#f1f5f9',
      background: json['background'] ?? '#ffffff',
      foreground: json['foreground'] ?? '#0f172a',
      muted: json['muted'] ?? '#f1f5f9',
      mutedForeground: json['mutedForeground'] ?? '#64748b',
      card: json['card'] ?? '#ffffff',
      cardForeground: json['cardForeground'] ?? '#0f172a',
      border: json['border'] ?? '#e2e8f0',
    );
  }

  Map<String, dynamic> toJson() => {
    'primary': primary,
    'secondary': secondary,
    'accent': accent,
    'background': background,
    'foreground': foreground,
    'muted': muted,
    'mutedForeground': mutedForeground,
    'card': card,
    'cardForeground': cardForeground,
    'border': border,
  };

  static TenantColors defaultLight() => const TenantColors(
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f1f5f9',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    card: '#ffffff',
    cardForeground: '#0f172a',
    border: '#e2e8f0',
  );

  static TenantColors defaultDark() => const TenantColors(
    primary: '#3b82f6',
    secondary: '#94a3b8',
    accent: '#1e293b',
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    card: '#1e293b',
    cardForeground: '#f8fafc',
    border: '#334155',
  );
}
