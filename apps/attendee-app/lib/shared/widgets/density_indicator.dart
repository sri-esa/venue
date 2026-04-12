// lib/shared/widgets/density_indicator.dart
// Color-coded density indicator — CRITICAL level pulses to signal urgency.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';
import '../../models/zone.dart';

class DensityIndicator extends StatefulWidget {
  final DensityLevel level;
  final bool showLabel;
  final bool animate; // CRITICAL level pulses when true

  const DensityIndicator({
    super.key,
    required this.level,
    this.showLabel = true,
    this.animate = true,
  });

  @override
  State<DensityIndicator> createState() => _DensityIndicatorState();
}

class _DensityIndicatorState extends State<DensityIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _pulseAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Only animate at CRITICAL level
    if (widget.animate && widget.level == DensityLevel.critical) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(DensityIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.level == DensityLevel.critical && widget.animate) {
      if (!_pulseController.isAnimating) _pulseController.repeat(reverse: true);
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Color get _indicatorColor {
    switch (widget.level) {
      case DensityLevel.low:
        return VenueColors.densityLow;
      case DensityLevel.moderate:
        return VenueColors.densityMedium;
      case DensityLevel.high:
        return VenueColors.densityHigh;
      case DensityLevel.critical:
        return VenueColors.densityCritical;
      case DensityLevel.unknown:
        return VenueColors.textTertiary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _indicatorColor;
    final isCritical = widget.level == DensityLevel.critical && widget.animate;

    Widget dot = Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: isCritical
            ? [
                BoxShadow(
                  color: color.withAlpha(128), // 50% opacity glow
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ]
            : null,
      ),
    );

    if (isCritical) {
      dot = AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) => Opacity(
          opacity: _pulseAnimation.value,
          child: child,
        ),
        child: dot,
      );
    }

    if (!widget.showLabel) return dot;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        dot,
        const SizedBox(width: VenueSpacing.xs),
        Text(
          widget.level.displayName.toUpperCase(),
          style: VenueTextStyles.labelSmall.copyWith(
            color: color,
            letterSpacing: 0.6,
          ),
        ),
      ],
    );
  }
}
