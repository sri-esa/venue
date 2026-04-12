// Feature: AR Wayfinding
// Layer: Experience Layer
// Implements: 3D Camera HUD + fallback 2D map
// Consumes: ArService
// Owner: Attendee App Team

import 'package:flutter/material.dart';
import 'package:arcore_flutter_plugin/arcore_flutter_plugin.dart';
import '../../../core/config/theme.dart';
import '../../../services/ar_service.dart';

class ArNavigationScreen extends StatefulWidget {
  const ArNavigationScreen({super.key});

  @override
  State<ArNavigationScreen> createState() => _ArNavigationScreenState();
}

class _ArNavigationScreenState extends State<ArNavigationScreen>
    with SingleTickerProviderStateMixin {
  final ArService _arService = ArService();
  bool _isArSupported = false;
  bool _isChecking = true;

  // Arrow pulse animation
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  // ignore: prefer_final_fields — mutable: increments via setState as user advances waypoints
  int _currentWaypoint = 0;
  final List<String> _instructions = [
    'Head toward Gate C',
    'Turn left at Gate C',
    'Continue 30m toward Food Court',
    'Arrive at Food Court A',
  ];

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _checkArSupport();
  }

  Future<void> _checkArSupport() async {
    final supported = await _arService.checkCompatibility();
    if (mounted) {
      setState(() {
        _isArSupported = supported;
        _isChecking = false;
      });
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _arService.disposeArSession();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        backgroundColor: VenueColors.navyDeep,
        body: Center(
          child: CircularProgressIndicator(
            color: VenueColors.electricBlue,
          ),
        ),
      );
    }

    if (!_isArSupported) {
      return _buildFallback2DMap(context);
    }

    return Scaffold(
      body: Stack(
        children: [
          // AR Camera View
          ArCoreView(
            onArCoreViewCreated: _arService.onArCoreViewCreated,
            enableTapRecognizer: true,
          ),
          // Heads-Up Display overlay
          _buildHud(context),
        ],
      ),
    );
  }

  Widget _buildHud(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // ── TOP BAR ──────────────────────────────────────────────────
          _BlurredBar(
            child: Row(
              children: [
                // Back button
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    padding: const EdgeInsets.all(VenueSpacing.sm),
                    decoration: BoxDecoration(
                      color: VenueColors.navyElevated.withAlpha(179),
                      borderRadius: BorderRadius.circular(VenueRadius.md),
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      color: VenueColors.textPrimary,
                      size: 22,
                    ),
                  ),
                ),

                const SizedBox(width: VenueSpacing.md),

                // Destination info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Heading to Food Court A',
                        style: VenueTextStyles.labelLarge,
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(
                            Icons.directions_walk_rounded,
                            size: 12,
                            color: VenueColors.electricBlue,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '~4 min walk',
                            style: VenueTextStyles.labelSmall.copyWith(
                              color: VenueColors.electricBlue,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Mini map thumbnail
                Container(
                  width: 72,
                  height: 56,
                  decoration: BoxDecoration(
                    color: VenueColors.navyElevated.withAlpha(204),
                    borderRadius: BorderRadius.circular(VenueRadius.md),
                    border: Border.all(
                      color: VenueColors.electricBlue.withAlpha(128),
                      width: 1,
                    ),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.map_rounded,
                        size: 20,
                        color: VenueColors.electricBlue,
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Mini Map',
                        style: VenueTextStyles.labelSmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── DIRECTION CARD ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(VenueSpacing.md),
            child: _BlurredBar(
              isBottom: true,
              child: Column(
                children: [
                  Row(
                    children: [
                      // Animated direction arrow
                      ScaleTransition(
                        scale: _pulseAnimation,
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            gradient: VenueColors.blueAccentGradient,
                            borderRadius: BorderRadius.circular(VenueRadius.lg),
                            boxShadow: [
                              BoxShadow(
                                color: VenueColors.electricBlue.withAlpha(102),
                                blurRadius: 16,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.turn_left_rounded,
                            color: Colors.white,
                            size: 36,
                          ),
                        ),
                      ),

                      const SizedBox(width: VenueSpacing.md),

                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentWaypoint < _instructions.length
                                  ? _instructions[_currentWaypoint]
                                  : 'You have arrived!',
                              style: VenueTextStyles.headlineMedium.copyWith(
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'in 23m',
                              style: VenueTextStyles.monoMedium.copyWith(
                                color: VenueColors.textSecondary,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: VenueSpacing.md),

                  // Waypoint progress dots
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_instructions.length, (i) {
                      final isCompleted = i < _currentWaypoint;
                      final isCurrent = i == _currentWaypoint;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isCurrent ? 20 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isCompleted || isCurrent
                              ? VenueColors.electricBlue
                              : VenueColors.navyBorder,
                          borderRadius:
                              BorderRadius.circular(VenueRadius.full),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallback2DMap(BuildContext context) {
    return Scaffold(
      backgroundColor: VenueColors.navyDeep,
      appBar: AppBar(
        backgroundColor: VenueColors.navyDeep,
        title: const Text('Navigation', style: VenueTextStyles.headlineMedium),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: VenueColors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        children: [
          // ARCore unavailable banner
          Container(
            margin: const EdgeInsets.all(VenueSpacing.md),
            padding: const EdgeInsets.all(VenueSpacing.md),
            decoration: BoxDecoration(
              color: VenueColors.navyCard,
              borderRadius: BorderRadius.circular(VenueRadius.md),
              border: Border.all(color: VenueColors.navyBorder, width: 1),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outlined,
                  color: VenueColors.info,
                  size: 18,
                ),
                const SizedBox(width: VenueSpacing.sm),
                Expanded(
                  child: Text(
                    'AR navigation unavailable on this device. Showing 2D map mode.',
                    style: VenueTextStyles.bodyMedium,
                  ),
                ),
              ],
            ),
          ),

          // 2D Map placeholder
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(VenueSpacing.md),
              decoration: BoxDecoration(
                color: VenueColors.navyCard,
                borderRadius: BorderRadius.circular(VenueRadius.xl),
                border: Border.all(color: VenueColors.navyBorder, width: 1),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(VenueRadius.xl),
                child: Stack(
                  children: [
                    // Map background grid
                    GridPaper(
                      color: VenueColors.navyBorder.withAlpha(77),
                      divisions: 3,
                      subdivisions: 3,
                    ),
                    // Center: destination marker
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(VenueSpacing.sm),
                            decoration: BoxDecoration(
                              color: VenueColors.electricBlue,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: VenueColors.electricBlue.withAlpha(128),
                                  blurRadius: 20,
                                  spreadRadius: 4,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.restaurant_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: VenueSpacing.sm),
                          Text(
                            'Food Court A',
                            style: VenueTextStyles.labelLarge,
                          ),
                        ],
                      ),
                    ),
                    // User position dot (bottom-left quadrant)
                    const Positioned(
                      bottom: 80,
                      left: 80,
                      child: _PulsingUserDot(),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom direction card
          Padding(
            padding: const EdgeInsets.all(VenueSpacing.md),
            child: Container(
              padding: const EdgeInsets.all(VenueSpacing.md),
              decoration: BoxDecoration(
                color: VenueColors.navyCard,
                borderRadius: BorderRadius.circular(VenueRadius.lg),
                border: Border.all(color: VenueColors.navyBorder, width: 1),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.turn_left_rounded,
                    color: VenueColors.electricBlue,
                    size: 36,
                  ),
                  const SizedBox(width: VenueSpacing.md),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Turn left at Gate C',
                        style: VenueTextStyles.headlineMedium,
                      ),
                      Text(
                        'in 23m',
                        style: VenueTextStyles.monoMedium.copyWith(
                          color: VenueColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── BLURRED HUD BAR ────────────────────────────────────────────────────────────
class _BlurredBar extends StatelessWidget {
  final Widget child;
  final bool isBottom;

  const _BlurredBar({required this.child, this.isBottom = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.fromLTRB(
        VenueSpacing.md,
        isBottom ? 0 : VenueSpacing.md,
        VenueSpacing.md,
        0,
      ),
      padding: const EdgeInsets.all(VenueSpacing.md),
      decoration: BoxDecoration(
        color: VenueColors.navyDeep.withAlpha(204), // ~80% opacity
        borderRadius: BorderRadius.circular(VenueRadius.xl),
        border: Border.all(
          color: VenueColors.navyBorder.withAlpha(128),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(77),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

// ── PULSING USER DOT ──────────────────────────────────────────────────────────
class _PulsingUserDot extends StatefulWidget {
  const _PulsingUserDot();

  @override
  State<_PulsingUserDot> createState() => _PulsingUserDotState();
}

class _PulsingUserDotState extends State<_PulsingUserDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ac;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ac = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _scale = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _ac, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scale,
      builder: (context, child) => Transform.scale(
        scale: _scale.value,
        child: Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: VenueColors.electricBlue,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: VenueColors.electricBlue.withAlpha(128),
                blurRadius: 12,
                spreadRadius: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
