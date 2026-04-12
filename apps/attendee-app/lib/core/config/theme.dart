// lib/core/config/theme.dart
// Layer: Experience Layer — Design System
// Implements: Visual identity for 50,000-attendee venue app
// Owner: Attendee App Team

import 'package:flutter/material.dart';

/// ─────────────────────────────────────────────
/// COLOR PALETTE
/// ─────────────────────────────────────────────
class VenueColors {
  // PRIMARY PALETTE — dark stadium environment
  static const Color navyDeep = Color(0xFF0A0E1A); // App background
  static const Color navyCard = Color(0xFF141829); // Card background
  static const Color navyElevated = Color(0xFF1E2438); // Elevated surfaces
  static const Color navyBorder = Color(0xFF2A3050); // Subtle borders

  // ACCENT
  static const Color electricBlue = Color(0xFF2563EB); // Primary CTA
  static const Color electricBlueLight = Color(0xFF3B82F6); // Hover/focus
  static const Color electricBlueDim = Color(0xFF1D4ED8); // Pressed

  // STATUS COLORS — density levels (used on indicators only)
  static const Color densityLow = Color(0xFF22C55E); // GREEN — safe
  static const Color densityMedium = Color(0xFFF59E0B); // AMBER — caution
  static const Color densityHigh = Color(0xFFF97316); // ORANGE — busy
  static const Color densityCritical = Color(0xFFEF4444); // RED — critical

  // SEMANTIC
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);
  static const Color error = Color(0xFFDC2626);
  static const Color info = Color(0xFF0284C7);

  // TEXT
  static const Color textPrimary = Color(0xFFF8FAFC); // Bright white
  static const Color textSecondary = Color(0xFF94A3B8); // Muted
  static const Color textTertiary = Color(0xFF475569); // Very muted
  static const Color textDisabled = Color(0xFF334155);

  // LIVE INDICATOR
  static const Color liveGreen = Color(0xFF4ADE80); // Pulsing live dot

  // GRADIENTS
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E3A8A), Color(0xFF0A0E1A)],
  );

  static const LinearGradient criticalGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7F1D1D), Color(0xFF141829)],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E2438), Color(0xFF141829)],
  );

  static const LinearGradient blueAccentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
  );
}

/// ─────────────────────────────────────────────
/// TEXT STYLES
/// ─────────────────────────────────────────────
class VenueTextStyles {
  // DISPLAY — hero numbers on dashboard
  static const TextStyle displayLarge = TextStyle(
    fontSize: 48,
    fontWeight: FontWeight.w800,
    letterSpacing: -1.5,
    color: VenueColors.textPrimary,
    height: 1.0,
  );

  static const TextStyle displayMedium = TextStyle(
    fontSize: 36,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.0,
    color: VenueColors.textPrimary,
    height: 1.1,
  );

  // HEADINGS
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    color: VenueColors.textPrimary,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.3,
    color: VenueColors.textPrimary,
  );

  // BODY
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: VenueColors.textPrimary,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: VenueColors.textSecondary,
    height: 1.4,
  );

  // LABELS
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    color: VenueColors.textPrimary,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    color: VenueColors.textSecondary,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.8,
    color: VenueColors.textTertiary,
  );

  // MONOSPACE — prevents layout shift when live numbers update
  static const TextStyle monoLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    fontFeatures: [FontFeature.tabularFigures()],
    color: VenueColors.textPrimary,
  );

  static const TextStyle monoMedium = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    fontFeatures: [FontFeature.tabularFigures()],
    color: VenueColors.textPrimary,
  );

  static const TextStyle monoSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    fontFeatures: [FontFeature.tabularFigures()],
    color: VenueColors.textSecondary,
  );
}

/// ─────────────────────────────────────────────
/// SPACING & RADIUS TOKENS
/// ─────────────────────────────────────────────
class VenueSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}

class VenueRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double full = 999.0;
}

/// ─────────────────────────────────────────────
/// THEME BUILDER
/// ─────────────────────────────────────────────
class VenueTheme {
  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: VenueColors.navyDeep,
    colorScheme: const ColorScheme.dark(
      primary: VenueColors.electricBlue,
      secondary: VenueColors.electricBlueLight,
      surface: VenueColors.navyCard,
      error: VenueColors.error,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: VenueColors.textPrimary,
    ),
    cardTheme: CardThemeData(
      color: VenueColors.navyCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(VenueRadius.lg),
        side: const BorderSide(
          color: VenueColors.navyBorder,
          width: 1,
        ),
      ),
      margin: EdgeInsets.zero,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: VenueColors.navyDeep,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: VenueTextStyles.headlineMedium,
      iconTheme: IconThemeData(color: VenueColors.textPrimary),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: VenueColors.navyCard,
      selectedItemColor: VenueColors.electricBlue,
      unselectedItemColor: VenueColors.textTertiary,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: VenueColors.navyElevated,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(VenueRadius.md),
        borderSide: const BorderSide(color: VenueColors.navyBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(VenueRadius.md),
        borderSide: const BorderSide(color: VenueColors.navyBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(VenueRadius.md),
        borderSide: const BorderSide(
          color: VenueColors.electricBlue,
          width: 2,
        ),
      ),
      hintStyle: VenueTextStyles.bodyMedium,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: VenueSpacing.md,
        vertical: VenueSpacing.md,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: VenueColors.electricBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(
          horizontal: VenueSpacing.lg,
          vertical: VenueSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(VenueRadius.md),
        ),
        textStyle: VenueTextStyles.labelLarge,
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: VenueColors.navyElevated,
      selectedColor: VenueColors.electricBlue,
      side: const BorderSide(color: VenueColors.navyBorder),
      labelStyle: VenueTextStyles.labelMedium,
      padding: const EdgeInsets.symmetric(
        horizontal: VenueSpacing.sm,
        vertical: VenueSpacing.xs,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(VenueRadius.full),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: VenueColors.navyBorder,
      thickness: 1,
      space: 1,
    ),
    iconTheme: const IconThemeData(
      color: VenueColors.textSecondary,
      size: 20,
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: VenueColors.electricBlue,
        textStyle: VenueTextStyles.labelLarge,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: VenueColors.navyElevated,
      contentTextStyle: VenueTextStyles.bodyMedium,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(VenueRadius.md),
      ),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return VenueColors.electricBlue;
        }
        return VenueColors.textTertiary;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return VenueColors.electricBlue.withAlpha(77); // ~30% opacity
        }
        return VenueColors.navyBorder;
      }),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: VenueColors.electricBlue,
      linearTrackColor: VenueColors.navyBorder,
    ),
  );
}
