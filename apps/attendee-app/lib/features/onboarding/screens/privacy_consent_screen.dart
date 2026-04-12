// Feature: Privacy Consent
// Layer: Experience Layer
// Implements: GDPR/DPDP consent flow before personalization
// Owner: Attendee App Team

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/config/theme.dart';

class PrivacyConsentScreen extends StatefulWidget {
  const PrivacyConsentScreen({super.key});

  @override
  State<PrivacyConsentScreen> createState() => _PrivacyConsentScreenState();
}

class _PrivacyConsentScreenState extends State<PrivacyConsentScreen> {
  bool _locationAwareness = false;
  bool _sessionPreferences = false;
  bool _smartAlerts = false;

  void _saveChoices() {
    // In production: saves consent with timestamp + privacy policy version
    // to Firestore profile.consent document
    context.go('/home');
  }

  void _continueWithoutPersonalization() {
    setState(() {
      _locationAwareness = false;
      _sessionPreferences = false;
      _smartAlerts = false;
    });
    _saveChoices();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VenueColors.navyDeep,
      appBar: AppBar(
        backgroundColor: VenueColors.navyDeep,
        title: const Text(
          'Personalize Your Experience',
          style: VenueTextStyles.headlineMedium,
        ),
        automaticallyImplyLeading: false, // Cannot be easily dismissed
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(VenueSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Choose what to share for smarter recommendations",
              style: VenueTextStyles.bodyLarge,
            ),
            const SizedBox(height: VenueSpacing.lg),
            _ConsentCard(
              emoji: '📍',
              title: "Smart Navigation",
              description:
                  "We use your location inside the venue to suggest "
                  "nearby stalls with short queues. We never share your "
                  "location or store it after you leave.",
              value: _locationAwareness,
              onChanged: (val) => setState(() => _locationAwareness = val),
            ),
            const SizedBox(height: VenueSpacing.md),
            _ConsentCard(
              emoji: '🎯',
              title: "Better Suggestions",
              description:
                  "We remember which stalls you visited this event to "
                  "avoid recommending the same place twice. This data "
                  "is deleted when you close the app.",
              value: _sessionPreferences,
              onChanged: (val) =>
                  setState(() => _sessionPreferences = val),
              finePrint:
                  "Deleted automatically when you close the app",
            ),
            const SizedBox(height: VenueSpacing.md),
            _ConsentCard(
              emoji: '🔔',
              title: "Smart Alerts",
              description:
                  "We send you alerts when your preferred stalls have "
                  "short queues, or when your exit route is clear.",
              value: _smartAlerts,
              onChanged: (val) => setState(() => _smartAlerts = val),
            ),
            const SizedBox(height: VenueSpacing.xl),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(VenueSpacing.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saveChoices,
                  child: const Text('Save My Choices'),
                ),
              ),
              const SizedBox(height: VenueSpacing.sm),
              TextButton(
                onPressed: _continueWithoutPersonalization,
                child: const Text('Continue Without Personalizing'),
              ),
              TextButton(
                onPressed: () {
                  // Opens in-app Privacy Policy view — future implementation
                },
                child: const Text(
                  'Privacy Policy',
                  style: TextStyle(
                    decoration: TextDecoration.underline,
                    color: VenueColors.electricBlue,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── CONSENT CARD ──────────────────────────────────────────────────────────────
class _ConsentCard extends StatelessWidget {
  final String emoji;
  final String title;
  final String description;
  final bool value;
  final ValueChanged<bool> onChanged;
  final String? finePrint;

  const _ConsentCard({
    required this.emoji,
    required this.title,
    required this.description,
    required this.value,
    required this.onChanged,
    this.finePrint,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      padding: const EdgeInsets.all(VenueSpacing.md),
      decoration: BoxDecoration(
        color: value
            ? VenueColors.electricBlue.withAlpha(13) // subtle active tint
            : VenueColors.navyCard,
        borderRadius: BorderRadius.circular(VenueRadius.lg),
        border: Border.all(
          color: value ? VenueColors.electricBlue : VenueColors.navyBorder,
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: VenueSpacing.md),

          // Text content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: VenueTextStyles.labelLarge),
                const SizedBox(height: VenueSpacing.xs),
                Text(description, style: VenueTextStyles.bodyMedium),
                if (finePrint != null) ...[
                  const SizedBox(height: VenueSpacing.xs),
                  Row(
                    children: [
                      const Icon(
                        Icons.lock_outline_rounded,
                        size: 11,
                        color: VenueColors.textTertiary,
                      ),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          finePrint!,
                          style: VenueTextStyles.labelSmall,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Toggle switch
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}
