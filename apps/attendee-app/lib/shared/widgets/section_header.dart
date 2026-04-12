// lib/shared/widgets/section_header.dart
// Consistent section labeling with optional trailing action and live badge.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        VenueSpacing.md, VenueSpacing.lg, VenueSpacing.md, VenueSpacing.sm,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  style: VenueTextStyles.labelLarge.copyWith(
                    letterSpacing: 1.2,
                    color: VenueColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: VenueTextStyles.labelSmall,
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
