// Role: Notification Service
// Layer: Experience Layer
// Implements: Req 7
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permissions (primarily for iOS, Android 13+)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: true,
      badge: true,
      carPlay: false,
      criticalAlert: true,
      provisional: false,
      sound: true,
    );
    
    debugPrint('User granted permission: ${settings.authorizationStatus}');

    // Register FCM Background Handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Register FCM Foreground Handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Got a message whilst in the foreground!');
      debugPrint('Message data: ${message.data}');

      if (message.notification != null) {
        debugPrint('Message also contained a notification: ${message.notification}');
        // In a real app, dispatch to a Bloc/Notifier to show the AlertBanner widget
      }
    });

    // Handle Tap on Notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('A new onMessageOpenedApp event was published!');
      _handleDeepLink(message.data);
    });

    // Get FCM Token
    String? token = await _messaging.getToken();
    if (token != null) {
      debugPrint('FCM Token generated: $token');
      // FirebaseService.updateAttendeeProfile(token); // Mock call
    }

    _messaging.onTokenRefresh.listen((newToken) {
      debugPrint('FCM Token refreshed: $newToken');
      // FirebaseService.updateAttendeeProfile(newToken); // Mock call
    });

    // Subscribe to venue base topic
    await subscribeToTopic('venue-venue-001-attendees');
  }

  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('Subscribed to topic: $topic');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('Unsubscribed from topic: $topic');
  }

  void _handleDeepLink(Map<String, dynamic> data) {
    if (data.containsKey('deepLink')) {
      final route = data['deepLink'];
      // router.push(route);
      debugPrint('Navigating to deepLink: $route');
    }
  }
}

// Background handler must be top-level
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Ensure Firebase is initialized if required, otherwise just handle the payload
  debugPrint("Handling a background message: ${message.messageId}");
}
