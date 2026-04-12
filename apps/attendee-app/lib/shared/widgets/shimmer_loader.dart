// lib/shared/widgets/shimmer_loader.dart
// Dark-themed shimmer placeholder for loading states.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';

class ShimmerLoader extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = VenueRadius.md,
  });

  /// Convenience constructor for a full-width shimmer block
  const ShimmerLoader.wide({
    super.key,
    required this.height,
    this.borderRadius = VenueRadius.md,
  }) : width = double.infinity;

  @override
  State<ShimmerLoader> createState() => _ShimmerLoaderState();
}

class _ShimmerLoaderState extends State<ShimmerLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _shimmerController;
  late final Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(); // Continuous loop

    _shimmerAnimation = CurvedAnimation(
      parent: _shimmerController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _shimmerAnimation,
      builder: (context, _) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              stops: [
                (_shimmerAnimation.value - 0.3).clamp(0.0, 1.0),
                _shimmerAnimation.value.clamp(0.0, 1.0),
                (_shimmerAnimation.value + 0.3).clamp(0.0, 1.0),
              ],
              colors: const [
                VenueColors.navyElevated,
                VenueColors.navyBorder,
                VenueColors.navyElevated,
              ],
            ),
          ),
        );
      },
    );
  }
}

/// A column of shimmer blocks mimicking a card's content structure.
class ShimmerCard extends StatelessWidget {
  const ShimmerCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(VenueSpacing.md),
      decoration: BoxDecoration(
        color: VenueColors.navyCard,
        borderRadius: BorderRadius.circular(VenueRadius.lg),
        border: Border.all(color: VenueColors.navyBorder, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerLoader(width: 80, height: 10, borderRadius: VenueRadius.full),
          const SizedBox(height: VenueSpacing.sm),
          ShimmerLoader(width: 120, height: 28, borderRadius: VenueRadius.sm),
          const SizedBox(height: VenueSpacing.xs),
          const ShimmerLoader.wide(height: 10, borderRadius: VenueRadius.full),
        ],
      ),
    );
  }
}
