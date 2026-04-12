// lib/shared/widgets/wait_time_chip.dart
// Color-coded wait time chip — transitions color smoothly over 600ms when data changes.

import 'package:flutter/material.dart';
import '../../core/config/theme.dart';

class WaitTimeChip extends StatefulWidget {
  /// Wait time in minutes. Use -1 to indicate CLOSED.
  final int minutes;
  final bool isClosed;

  const WaitTimeChip({
    super.key,
    required this.minutes,
    this.isClosed = false,
  });

  @override
  State<WaitTimeChip> createState() => _WaitTimeChipState();
}

class _WaitTimeChipState extends State<WaitTimeChip>
    with SingleTickerProviderStateMixin {
  late final AnimationController _colorController;
  late Animation<Color?> _bgColorAnimation;
  late Animation<Color?> _textColorAnimation;

  Color _targetBg = Colors.transparent;
  Color _targetText = VenueColors.textPrimary;

  @override
  void initState() {
    super.initState();
    _colorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _computeColors();
    _setupAnimations(_targetBg, _targetText);
    _colorController.value = 1.0; // Start at target color immediately
  }

  @override
  void didUpdateWidget(WaitTimeChip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.minutes != widget.minutes ||
        oldWidget.isClosed != widget.isClosed) {
      final prevBg = _targetBg;
      final prevText = _targetText;

      _computeColors();
      _setupAnimations(prevBg, prevText);
      _colorController.forward(from: 0); // Animate color transition
    }
  }

  void _computeColors() {
    if (widget.isClosed) {
      _targetBg = VenueColors.navyBorder;
      _targetText = VenueColors.textTertiary;
    } else if (widget.minutes < 5) {
      _targetBg = VenueColors.densityLow.withAlpha(51); // ~20%
      _targetText = VenueColors.densityLow;
    } else if (widget.minutes <= 15) {
      _targetBg = VenueColors.densityMedium.withAlpha(51);
      _targetText = VenueColors.densityMedium;
    } else {
      _targetBg = VenueColors.densityCritical.withAlpha(51);
      _targetText = VenueColors.densityCritical;
    }
  }

  void _setupAnimations(Color fromBg, Color fromText) {
    _bgColorAnimation = ColorTween(
      begin: fromBg,
      end: _targetBg,
    ).animate(CurvedAnimation(parent: _colorController, curve: Curves.easeInOut));

    _textColorAnimation = ColorTween(
      begin: fromText,
      end: _targetText,
    ).animate(CurvedAnimation(parent: _colorController, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _colorController.dispose();
    super.dispose();
  }

  String get _label {
    if (widget.isClosed) return 'Closed';
    return '${widget.minutes} min';
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _colorController,
      builder: (context, _) {
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: VenueSpacing.sm,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: _bgColorAnimation.value ?? _targetBg,
            borderRadius: BorderRadius.circular(VenueRadius.full),
            border: Border.all(
              color: (_textColorAnimation.value ?? _targetText).withAlpha(77),
              width: 1,
            ),
          ),
          child: Text(
            _label,
            style: VenueTextStyles.monoSmall.copyWith(
              color: _textColorAnimation.value ?? _targetText,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        );
      },
    );
  }
}
