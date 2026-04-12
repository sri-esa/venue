// Feature: Queue State Management
// Layer: Experience Layer
// Implements: Riverpod providers for queue data
// Consumes: FirebaseService.watchAllQueues
// Owner: Attendee App Team

import 'package:flutter_riverpod/flutter_riverpod.dart';
// FIX (Category B): Removed local stub QueueStatus and FirebaseService classes
// that were conflicting with the actual implementations in their respective files.
// Now imports the real classes.
import '../models/queue_status.dart';
import '../services/firebase_service.dart';

/// Provider that holds the current venue ID for the session.
final currentVenueIdProvider = Provider<String>((ref) => 'venue_1');

/// Singleton provider for FirebaseService
final firebaseServiceProvider = Provider<FirebaseService>((ref) {
  return FirebaseService();
});

/// Fine-grained provider per queue ID — minimizes rebuilds when one queue updates.
/// Only the widget subscribed to a specific queueId will rebuild on its data change.
final queueByIdProvider = StreamProvider.family<QueueStatus, String>(
  (ref, queueId) {
    final venueId = ref.watch(currentVenueIdProvider);
    final service = ref.watch(firebaseServiceProvider);
    return service.watchQueue(venueId, queueId);
  },
);

/// Provider that streams all queues for the current venue.
final allQueuesProvider = StreamProvider<List<QueueStatus>>((ref) {
  final venueId = ref.watch(currentVenueIdProvider);
  final service = ref.watch(firebaseServiceProvider);
  return service.watchAllQueues(venueId);
});
