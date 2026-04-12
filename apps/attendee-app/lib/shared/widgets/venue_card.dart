// lib/shared/widgets/venue_card.dart
// Reusable card with glassmorphism-inspired dark styling + optional tap animation.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';

class VenueCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool isElevated;
  final Gradient? gradient;
  final Color? borderColor;
  final double? borderRadius;

  const VenueCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.isElevated = false,
    this.gradient,
    this.borderColor,
    this.borderRadius,
  });

  @override
  State<VenueCard> createState() => _VenueCardState();
}

class _VenueCardState extends State<VenueCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    // Always dispose AnimationController to prevent memory leaks
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final radius = widget.borderRadius ?? VenueRadius.lg;

    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: widget.onTap != null ? (_) => _scaleController.forward() : null,
      onTapUp: widget.onTap != null ? (_) => _scaleController.reverse() : null,
      onTapCancel: widget.onTap != null ? () => _scaleController.reverse() : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          decoration: BoxDecoration(
            gradient: widget.gradient ?? VenueColors.cardGradient,
            color: widget.gradient == null ? (
              widget.isElevated ? VenueColors.navyElevated : VenueColors.navyCard
            ) : null,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: widget.borderColor ?? VenueColors.navyBorder,
              width: 1,
            ),
            boxShadow: widget.isElevated
                ? [
                    BoxShadow(
                      color: Colors.black.withAlpha(102), // 40% opacity
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          padding: widget.padding ??
              const EdgeInsets.all(VenueSpacing.md),
          child: widget.child,
        ),
      ),
    );
  }
}
