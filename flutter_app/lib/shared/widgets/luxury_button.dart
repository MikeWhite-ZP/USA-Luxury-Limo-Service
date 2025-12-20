import 'package:flutter/material.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';

enum LuxuryButtonVariant { filled, outlined, text }

class LuxuryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final LuxuryButtonVariant variant;
  final bool isLoading;
  final bool isFullWidth;
  final IconData? icon;
  final double? width;
  final double? height;

  const LuxuryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = LuxuryButtonVariant.filled,
    this.isLoading = false,
    this.isFullWidth = true,
    this.icon,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: isFullWidth ? double.infinity : width,
      height: height ?? 56,
      child: switch (variant) {
        LuxuryButtonVariant.filled => _buildFilledButton(),
        LuxuryButtonVariant.outlined => _buildOutlinedButton(),
        LuxuryButtonVariant.text => _buildTextButton(),
      },
    );
  }

  Widget _buildFilledButton() {
    return Container(
      decoration: BoxDecoration(
        gradient: onPressed != null && !isLoading
            ? const LinearGradient(
                colors: [AppColors.gold, AppColors.goldLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: onPressed == null || isLoading ? AppColors.surfaceLight : null,
        borderRadius: BorderRadius.circular(16),
        boxShadow: onPressed != null && !isLoading
            ? [
                BoxShadow(
                  color: AppColors.gold.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child: _buildContent(AppColors.backgroundDark),
          ),
        ),
      ),
    );
  }

  Widget _buildOutlinedButton() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: onPressed != null && !isLoading
              ? AppColors.gold
              : AppColors.textSecondary,
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child: _buildContent(
              onPressed != null && !isLoading
                  ? AppColors.gold
                  : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextButton() {
    return TextButton(
      onPressed: isLoading ? null : onPressed,
      child: _buildContent(
        onPressed != null && !isLoading
            ? AppColors.gold
            : AppColors.textSecondary,
      ),
    );
  }

  Widget _buildContent(Color color) {
    if (isLoading) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      );
    }

    return Text(
      text,
      style: TextStyle(
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
      ),
    );
  }
}
