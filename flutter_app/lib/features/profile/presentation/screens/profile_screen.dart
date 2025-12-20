import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/features/auth/presentation/providers/auth_provider.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: AppColors.cardGradient,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: AppColors.goldGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gold.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        user?.initials ?? 'U',
                        style: const TextStyle(
                          fontFamily: 'Playfair',
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: AppColors.backgroundDark,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.fullName ?? 'Guest User',
                    style: const TextStyle(
                      fontFamily: 'Playfair',
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  if (user?.phone != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      user!.phone!,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            LuxuryCard(
              child: Column(
                children: [
                  _SettingsItem(
                    icon: Icons.person_outline,
                    title: 'Edit Profile',
                    onTap: () {},
                  ),
                  const Divider(color: AppColors.divider),
                  _SettingsItem(
                    icon: Icons.credit_card_outlined,
                    title: 'Payment Methods',
                    onTap: () {},
                  ),
                  const Divider(color: AppColors.divider),
                  _SettingsItem(
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    onTap: () {},
                  ),
                  const Divider(color: AppColors.divider),
                  _SettingsItem(
                    icon: Icons.location_on_outlined,
                    title: 'Saved Addresses',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            LuxuryCard(
              child: Column(
                children: [
                  _SettingsItem(
                    icon: Icons.help_outline,
                    title: 'Help & Support',
                    onTap: () {},
                  ),
                  const Divider(color: AppColors.divider),
                  _SettingsItem(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Privacy Policy',
                    onTap: () {},
                  ),
                  const Divider(color: AppColors.divider),
                  _SettingsItem(
                    icon: Icons.description_outlined,
                    title: 'Terms of Service',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            LuxuryCard(
              child: _SettingsItem(
                icon: Icons.logout,
                title: 'Sign Out',
                iconColor: AppColors.error,
                titleColor: AppColors.error,
                showArrow: false,
                onTap: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: AppColors.surface,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      title: const Text('Sign Out'),
                      content: const Text('Are you sure you want to sign out?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text(
                            'Sign Out',
                            style: TextStyle(color: AppColors.error),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true) {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  }
                },
              ),
            ),
            const SizedBox(height: 32),

            Text(
              'Version 1.0.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? titleColor;
  final bool showArrow;

  const _SettingsItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.iconColor,
    this.titleColor,
    this.showArrow = true,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: (iconColor ?? AppColors.gold).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 22,
                color: iconColor ?? AppColors.gold,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: titleColor ?? AppColors.textPrimary,
                ),
              ),
            ),
            if (showArrow)
              const Icon(
                Icons.chevron_right,
                color: AppColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }
}
