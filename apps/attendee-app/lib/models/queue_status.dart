// Feature: Queue Monitor
// Layer: Experience Layer
// Implements: Real-time wait time displays (Phase 1)
// Consumes: GET /queues/:venueId
// Owner: Attendee App Team
import 'package:json_annotation/json_annotation.dart';

part 'queue_status.g.dart';

@JsonSerializable()
class QueueStatus {
  final String queueId;
  final String stallId;
  final String stallName;
  final String stallType;
  final int currentLength;
  final int estimatedWaitMinutes;
  final bool isOpen;
  final double distanceMeters;
  final DateTime lastUpdated;

  QueueStatus({
    required this.queueId, required this.stallId, required this.stallName, required this.stallType,
    required this.currentLength, required this.estimatedWaitMinutes, required this.isOpen,
    required this.distanceMeters, required this.lastUpdated,
  });

  bool get isRecommended => isOpen && estimatedWaitMinutes <= 10;

  factory QueueStatus.fromJson(Map<String, dynamic> json) => _$QueueStatusFromJson(json);
  Map<String, dynamic> toJson() => _$QueueStatusToJson(this);
  
  factory QueueStatus.fromFirebase(Map<String, dynamic> snapshot) {
    return QueueStatus.fromJson(snapshot);
  }
}
