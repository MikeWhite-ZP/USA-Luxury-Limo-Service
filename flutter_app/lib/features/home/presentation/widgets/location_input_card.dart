import 'package:flutter/material.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';

class LocationInputCard extends StatelessWidget {
  final TextEditingController pickupController;
  final TextEditingController dropoffController;
  final VoidCallback onPickupTap;
  final VoidCallback onDropoffTap;

  const LocationInputCard({
    super.key,
    required this.pickupController,
    required this.dropoffController,
    required this.onPickupTap,
    required this.onDropoffTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.gold,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.goldLight, width: 2),
                    ),
                  ),
                  Container(
                    width: 2,
                    height: 40,
                    color: AppColors.divider,
                  ),
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.successLight, width: 2),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  children: [
                    _LocationInput(
                      controller: pickupController,
                      hint: 'Pickup location',
                      onTap: onPickupTap,
                    ),
                    const Divider(color: AppColors.divider, height: 24),
                    _LocationInput(
                      controller: dropoffController,
                      hint: 'Where to?',
                      onTap: onDropoffTap,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LocationInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final VoidCallback onTap;

  const _LocationInput({
    required this.controller,
    required this.hint,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AbsorbPointer(
        child: TextField(
          controller: controller,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            color: AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 16,
            ),
            border: InputBorder.none,
            isDense: true,
            contentPadding: EdgeInsets.zero,
            suffixIcon: controller.text.isNotEmpty
                ? const Icon(Icons.check_circle, color: AppColors.success, size: 18)
                : null,
          ),
        ),
      ),
    );
  }
}
