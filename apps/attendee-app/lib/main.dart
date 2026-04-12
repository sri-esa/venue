import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'router/app_router.dart';
import 'core/config/theme.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase — overriding console config to use bare GCP project
  try {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: String.fromEnvironment('GCP_API_KEY'),
        appId: '1:265873384374:web:b770ba185b4cedaa621717',
        messagingSenderId: '265873384374',
        projectId: 'crowd-management-system-492802' // NATIVE GCP PROJECT
      )
    );
  } catch (e) {
    // Firebase not configured yet (missing google-services.json / web config)
    // App will still launch in degraded mode for UI preview
    debugPrint('Firebase init skipped: $e');
  }

  // Initialize notifications only if not on web (FCM is mobile-only)
  if (!kIsWeb) {
    try {
      final notificationService = NotificationService();
      await notificationService.initialize();
    } catch (e) {
      debugPrint('NotificationService init skipped: $e');
    }
  }

  runApp(const SmartVenueApp());
}

class SmartVenueApp extends StatelessWidget {
  const SmartVenueApp({super.key});

  @override
  Widget build(BuildContext context) {
    // FIX: Use appRouter from router/app_router.dart instead of bare home: HomeScreen()
    // FIX: Apply VenueTheme.dark for the complete design system
    return MaterialApp.router(
      title: 'Smart Venue',
      debugShowCheckedModeBanner: false,
      theme: VenueTheme.dark,
      routerConfig: appRouter,
    );
  }
}
