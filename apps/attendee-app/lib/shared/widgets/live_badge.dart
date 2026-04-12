// lib/shared/widgets/live_badge.dart
// Pulsing "LIVE" badge with animated green dot — communicates real-time data status.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';

enum LiveBadgeSize { sm, md, lg }

class LiveBadge extends StatefulWidget {
  final LiveBadgeSize size;
  final bool showLabel;

  const LiveBadge({
    super.key,
    this.size = LiveBadgeSize.md,
    this.showLabel = true,
  });

  @override
  State<LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<LiveBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true); // Pulse every 1.5s, reversing for smooth loop

    _pulseAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    // Dispose prevents memory leaks and orphaned timers
    _pulseController.dispose();
    super.dispose();
  }

  double get _dotSize {
    switch (widget.size) {
      case LiveBadgeSize.sm:
        return 7.0;
      case LiveBadgeSize.md:
        return 9.0;
      case LiveBadgeSize.lg:
        return 11.0;
    }
  }

  double get _fontSize {
    switch (widget.size) {
      case LiveBadgeSize.sm:
        return 10.0;
      case LiveBadgeSize.md:
        return 11.0;
      case LiveBadgeSize.lg:
        return 12.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: VenueSpacing.sm,
        vertical: VenueSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: VenueColors.liveGreen.withAlpha(26), // ~10% opacity
        borderRadius: BorderRadius.circular(VenueRadius.full),
        border: Border.all(
          color: VenueColors.liveGreen.withAlpha(77), // ~30% opacity
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, _) {
              return Opacity(
                opacity: _pulseAnimation.value,
                child: Container(
                  width: _dotSize,
                  height: _dotSize,
                  decoration: const BoxDecoration(
                    color: VenueColors.liveGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              );
            },
          ),
          if (widget.showLabel) ...[
            const SizedBox(width: 5),
            Text(
              'LIVE',
              style: TextStyle(
                fontSize: _fontSize,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: VenueColors.liveGreen,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
