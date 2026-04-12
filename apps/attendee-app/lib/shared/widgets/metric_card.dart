// lib/shared/widgets/metric_card.dart
// Large stat display card — used on home screen for key venue metrics.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';
import 'venue_card.dart';

class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final Color? valueColor;
  final Widget? leading; // Icon or status indicator
  final VoidCallback? onTap;
  final double width;

  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    this.subtitle,
    this.valueColor,
    this.leading,
    this.onTap,
    this.width = 148,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: VenueCard(
        onTap: onTap,
        isElevated: true,
        gradient: VenueColors.cardGradient,
        padding: const EdgeInsets.all(VenueSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Label row with optional leading icon
            Row(
              children: [
                if (leading != null) ...[
                  leading!,
                  const SizedBox(width: VenueSpacing.xs),
                ],
                Expanded(
                  child: Text(
                    label.toUpperCase(),
                    style: VenueTextStyles.labelSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: VenueSpacing.sm),
            // Value — large tabular mono to prevent layout shift on update
            Text(
              value,
              style: VenueTextStyles.monoLarge.copyWith(
                fontSize: 26,
                color: valueColor ?? VenueColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle!,
                style: VenueTextStyles.labelSmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
