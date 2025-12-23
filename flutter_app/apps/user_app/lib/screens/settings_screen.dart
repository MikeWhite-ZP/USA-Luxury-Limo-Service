import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:core/core.dart';
import 'package:theme/theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeProvider);
    final tenantConfig = ref.watch(tenantConfigProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Appearance',
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
                  _buildThemeOption(
                    context,
                    ref,
                    icon: Icons.light_mode,
                    label: 'Light',
                    isSelected: themeState.mode == ThemeModeSetting.light,
                    onTap: () {
                      ref.read(themeProvider.notifier).setThemeMode(ThemeModeSetting.light);
                    },
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  _buildThemeOption(
                    context,
                    ref,
                    icon: Icons.dark_mode,
                    label: 'Dark',
                    isSelected: themeState.mode == ThemeModeSetting.dark,
                    onTap: () {
                      ref.read(themeProvider.notifier).setThemeMode(ThemeModeSetting.dark);
                    },
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  _buildThemeOption(
                    context,
                    ref,
                    icon: Icons.phone_android,
                    label: 'System',
                    isSelected: themeState.mode == ThemeModeSetting.system,
                    onTap: () {
                      ref.read(themeProvider.notifier).setThemeMode(ThemeModeSetting.system);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text(
              'Notifications',
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
                  _buildSwitchOption(
                    context,
                    icon: Icons.notifications_outlined,
                    label: 'Push Notifications',
                    value: true,
                    onChanged: (value) {},
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  _buildSwitchOption(
                    context,
                    icon: Icons.email_outlined,
                    label: 'Email Notifications',
                    value: true,
                    onChanged: (value) {},
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  _buildSwitchOption(
                    context,
                    icon: Icons.sms_outlined,
                    label: 'SMS Notifications',
                    value: false,
                    onChanged: (value) {},
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
                      '1.0.0',
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
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  ListTile(
                    leading: const Icon(Icons.article_outlined),
                    title: const Text('Terms of Service'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {},
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  ListTile(
                    leading: const Icon(Icons.privacy_tip_outlined),
                    title: const Text('Privacy Policy'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeOption(
    BuildContext context,
    WidgetRef ref, {
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: isSelected
          ? Icon(Icons.check, color: Theme.of(context).primaryColor)
          : null,
      onTap: onTap,
    );
  }

  Widget _buildSwitchOption(
    BuildContext context, {
    required IconData icon,
    required String label,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
      ),
    );
  }
}
