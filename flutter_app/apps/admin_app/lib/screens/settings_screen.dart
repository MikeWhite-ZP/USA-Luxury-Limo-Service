import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:core/core.dart';
import 'package:theme/theme.dart';

class AdminSettingsScreen extends ConsumerWidget {
  const AdminSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeProvider);
    final tenantConfig = ref.watch(tenantConfigProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/admin'),
        ),
        title: const Text('Settings'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Theme',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.light_mode),
                    title: const Text('Light'),
                    trailing: themeState.mode == ThemeModeSetting.light
                        ? Icon(Icons.check, color: Theme.of(context).primaryColor)
                        : null,
                    onTap: () {
                      ref.read(themeProvider.notifier).setThemeMode(ThemeModeSetting.light);
                    },
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  ListTile(
                    leading: const Icon(Icons.dark_mode),
                    title: const Text('Dark'),
                    trailing: themeState.mode == ThemeModeSetting.dark
                        ? Icon(Icons.check, color: Theme.of(context).primaryColor)
                        : null,
                    onTap: () {
                      ref.read(themeProvider.notifier).setThemeMode(ThemeModeSetting.dark);
                    },
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  ListTile(
                    leading: const Icon(Icons.phone_android),
                    title: const Text('System'),
                    trailing: themeState.mode == ThemeModeSetting.system
                        ? Icon(Icons.check, color: Theme.of(context).primaryColor)
                        : null,
                    onTap: () {
                      ref.read(themeProvider.notifier).setThemeMode(ThemeModeSetting.system);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text(
              'About',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.info_outline),
                    title: const Text('App Version'),
                    trailing: Text(
                      '1.0.0 (Admin)',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).hintColor,
                      ),
                    ),
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  ListTile(
                    leading: const Icon(Icons.business),
                    title: const Text('Company'),
                    trailing: Text(
                      tenantConfig?.name ?? 'USA Luxury Limo',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).hintColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
