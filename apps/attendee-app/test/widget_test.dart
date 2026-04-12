// Basic smoke test for SmartVenueApp.
// Full integration tests would require Firebase emulator setup.

import 'package:flutter_test/flutter_test.dart';
import 'package:attendee_app/main.dart';

void main() {
  testWidgets('App smoke test — SmartVenueApp renders without crash',
      (WidgetTester tester) async {
    // FIX: Was 'MyApp()' which no longer exists — app class was renamed to SmartVenueApp.
    // Note: Full app test requires Firebase to be initialized. This test only
    // verifies the widget tree builds without compile errors.
    // For full integration tests, use firebase_emulator_suite.
    await tester.pumpWidget(const SmartVenueApp());
    // Basic sanity: app renders something
    expect(find.byType(SmartVenueApp), findsOneWidget);
  });
}
