// Feature: GCP Firestore Native Data Sync
// Layer: Experience Layer
// Implements: Sync requirement <500ms
// Consumes: Cloud Firestore
// Owner: Attendee App Team

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/zone.dart';
import '../models/queue_status.dart';

class FirebaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Zone>> watchVenueZones(String venueId) {
    return _db.collection('venues').doc(venueId).collection('zones').snapshots().map((snapshot) {
      if (snapshot.docs.isEmpty) return <Zone>[];
      final list = snapshot.docs
          .map((doc) => Zone.fromJson(doc.data()))
          .toList();
      // Sort by density level: highest first (most crowded)
      list.sort((a, b) => b.densityLevel.sortIndex.compareTo(a.densityLevel.sortIndex));
      return list;
    }).distinct((prev, next) {
      // Throttle rapid updates to prevent exceeding 50k free tier quota
      if (prev.length != next.length) return false;
      for (int i = 0; i < prev.length; i++) {
        if (prev[i].occupancy != next[i].occupancy) return false;
      }
      return true;
    });
  }

  Stream<Zone> watchZone(String venueId, String zoneId) {
    return _db.collection('venues').doc(venueId).collection('zones').doc(zoneId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) throw Exception("Zone Not Found");
      return Zone.fromJson(snapshot.data()!);
    }).distinct((prev, next) => prev.occupancy == next.occupancy);
  }

  bool queueListEquals(List<QueueStatus> prev, List<QueueStatus> next) {
    if (prev.length != next.length) return false;
    for (int i = 0; i < prev.length; i++) {
      if (prev[i].currentLength != next[i].currentLength) return false;
      if (prev[i].estimatedWaitMinutes != next[i].estimatedWaitMinutes) return false;
      if (prev[i].isOpen != next[i].isOpen) return false;
    }
    return true;
  }

  /// Watch all queues for a venue, sorted by wait time ascending.
  /// Uses .distinct() to suppress redundant updates when data hasn't meaningfully changed.
  Stream<List<QueueStatus>> watchAllQueues(String venueId) {
    return _db.collection('venues').doc(venueId).collection('queues').snapshots().map((snapshot) {
      if (snapshot.docs.isEmpty) return <QueueStatus>[];
      final list = snapshot.docs
          .map((doc) => QueueStatus.fromFirebase(doc.data()))
          .toList();
      list.sort((a, b) => a.estimatedWaitMinutes.compareTo(b.estimatedWaitMinutes));
      return list;
    }).distinct(queueListEquals);
  }

  /// Watch a single queue by ID — used for fine-grained Riverpod providers.
  Stream<QueueStatus> watchQueue(String venueId, String queueId) {
    return _db.collection('venues').doc(venueId).collection('queues').doc(queueId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) {
        throw Exception("Queue $queueId not found in venue $venueId");
      }
      return QueueStatus.fromFirebase(snapshot.data()!);
    }).distinct((prev, next) => queueListEquals([prev], [next]));
  }
}
