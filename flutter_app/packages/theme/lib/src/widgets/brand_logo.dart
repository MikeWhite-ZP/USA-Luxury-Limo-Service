import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

class BrandLogo extends ConsumerWidget {
  final double? width;
  final double? height;
  final BoxFit fit;

  const BrandLogo({
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tenantConfig = ref.watch(tenantConfigProvider);
    final logoUrl = tenantConfig?.logoUrl;

    if (logoUrl == null || logoUrl.isEmpty) {
      return _buildFallbackLogo(context, tenantConfig?.name ?? 'USA Luxury Limo');
    }

    return CachedNetworkImage(
      imageUrl: logoUrl,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => _buildLoadingPlaceholder(),
      errorWidget: (context, url, error) => 
        _buildFallbackLogo(context, tenantConfig?.name ?? 'USA Luxury Limo'),
    );
  }

  Widget _buildLoadingPlaceholder() {
    return SizedBox(
      width: width ?? 120,
      height: height ?? 40,
      child: const Center(
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
    );
  }

  Widget _buildFallbackLogo(BuildContext context, String companyName) {
    return SizedBox(
      width: width ?? 120,
      height: height ?? 40,
      child: Center(
        child: Text(
          companyName,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Theme.of(context).primaryColor,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}
