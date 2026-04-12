// Feature: App Routing
// Layer: Experience Layer
// Implements: go_router navigation scheme
// Owner: Attendee App Team

import 'package:go_router/go_router.dart';
import '../features/home/screens/home_screen.dart';
import '../features/navigation/screens/ar_navigation_screen.dart';
import '../features/assistant/screens/assistant_screen.dart';
import '../features/queues/screens/queue_list_screen.dart';
import '../features/onboarding/screens/privacy_consent_screen.dart';
import '../features/onboarding/screens/preference_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/home',
  routes: [
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'map/ar',
          name: 'ar_navigation',
          builder: (context, state) => const ArNavigationScreen(),
        ),
        GoRoute(
          path: 'assistant',
          name: 'assistant',
          builder: (context, state) => const AssistantScreen(),
        ),
        GoRoute(
          path: 'queues',
          name: 'queues',
          builder: (context, state) => const QueueListScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/onboarding',
      name: 'onboarding',
      builder: (context, state) => const PrivacyConsentScreen(),
    ),
    GoRoute(
      path: '/preferences',
      name: 'preferences',
      builder: (context, state) => const PreferenceScreen(),
    ),
  ],
);
