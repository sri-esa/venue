// Feature: Zone Data Model
// Layer: Experience Layer
// Implements: Crowd density zone representation
// Consumes: Firebase Realtime Database — /venues/{venueId}/zones
// Owner: Attendee App Team

import 'package:json_annotation/json_annotation.dart';

part 'zone.g.dart';

/// Maps to DensityLevel in shared/types/crowd.types.ts
enum DensityLevel {
  @JsonValue('LOW')
  low,

  @JsonValue('MODERATE')
  moderate,

  @JsonValue('HIGH')
  high,

  @JsonValue('CRITICAL')
  critical,

  @JsonValue('UNKNOWN')
  unknown,
}

/// Extension to get display-ready properties from DensityLevel
extension DensityLevelExtension on DensityLevel {
  String get displayName {
    switch (this) {
      case DensityLevel.low:
        return 'Low';
      case DensityLevel.moderate:
        return 'Moderate';
      case DensityLevel.high:
        return 'High';
      case DensityLevel.critical:
        return 'Critical';
      case DensityLevel.unknown:
        return 'Unknown';
    }
  }

  bool get isSafe => this == DensityLevel.low || this == DensityLevel.moderate;

  /// Returns a numeric 0–4 index for sorting (higher = more crowded)
  int get sortIndex {
    switch (this) {
      case DensityLevel.unknown:
        return 0;
      case DensityLevel.low:
        return 1;
      case DensityLevel.moderate:
        return 2;
      case DensityLevel.high:
        return 3;
      case DensityLevel.critical:
        return 4;
    }
  }
}

@JsonSerializable()
class Zone {
  final String zoneId;
  final String name;
  final DensityLevel densityLevel;
  final int? currentOccupancy;
  final int? maxCapacity;
  final DateTime? lastUpdated;

  const Zone({
    required this.zoneId,
    required this.name,
    required this.densityLevel,
    this.currentOccupancy,
    this.maxCapacity,
    this.lastUpdated,
  });

  /// Occupancy as a fraction 0.0–1.0; null if data unavailable.
  double? get occupancyFraction {
    if (currentOccupancy == null || maxCapacity == null || maxCapacity == 0) {
      return null;
    }
    return currentOccupancy! / maxCapacity!;
  }

  factory Zone.fromJson(Map<String, dynamic> json) => _$ZoneFromJson(json);
  Map<String, dynamic> toJson() => _$ZoneToJson(this);
}
