// Feature: Gemini AI Concierge
// Layer: Experience Layer
// Implements: NLP AI Assistant for attendees
// Consumes: Vertex AI Gemini API (google_generative_ai package)
// Owner: Attendee App Team

import 'dart:async';
import 'dart:convert';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:crypto/crypto.dart' as crypto;
import '../models/queue_status.dart';
import '../models/zone.dart';

// Dart translation of shared/types/attendee-personalization.types.ts
import '../shared/types/attendee_personalization_types.dart';

class GeminiService {
  // FIX (Category D): Was 'gemini-3-pro' which doesn't exist.
  // Corrected to a valid model identifier: gemini-1.5-pro.
  late final GenerativeModel _model;

  GeminiService() {
    _model = GenerativeModel(
      model: 'gemini-1.5-pro',
      apiKey: const String.fromEnvironment('GEMINI_API_KEY', defaultValue: 'DEV_KEY'),
    );
  }

  static const String _systemPrompt = """
You are VenueAI, a helpful assistant for attendees at [VENUE_NAME] 
during [EVENT_NAME].

YOUR CAPABILITIES:
- Tell attendees the shortest queue for food/drinks right now
- Give walking directions to any venue location
- Tell them wait times at specific stalls
- Warn them about crowded areas to avoid
- Answer questions about the event schedule
- Help them find accessible routes if needed

LIVE CONTEXT (injected per message):
{LIVE_CONTEXT}

RESPONSE RULES:
- Always be concise — max 3 sentences per response
- Always include a specific action the attendee can take
- If directing somewhere, always state estimated walk time
- If a stall is closed or queue is too long, suggest nearest alternative
- Never mention technical system names (Firebase, ARCore, etc.)
- Speak like a knowledgeable, friendly stadium staff member
- If you don't know something, say so honestly
- NEVER make up queue times or crowd data — only use LIVE_CONTEXT
""";

  String buildLiveContext({
    required List<QueueStatus> nearbyQueues,
    required List<Zone> crowdedZones,
    required String attendeeLocation,
    required String? seatLocation,
  }) {
    final queueStrings = nearbyQueues.take(5).toList().asMap().entries.map((e) =>
      "${e.key + 1}. ${e.value.stallName}: ${e.value.estimatedWaitMinutes} min wait, "
      "${e.value.distanceMeters.toStringAsFixed(0)}m away, "
      "${e.value.isOpen ? 'OPEN' : 'CLOSED'}"
    ).join("\n");

    final crowdedStrings = crowdedZones
        .map((z) => "- ${z.name}: ${z.densityLevel.displayName} density")
        .join("\n");

    return """
CURRENT TIME: ${DateTime.now().toIso8601String()}
ATTENDEE LOCATION: Zone $attendeeLocation
ATTENDEE SEAT: ${seatLocation ?? "unknown"}

TOP 5 NEAREST QUEUES:
$queueStrings

CROWDED AREAS TO AVOID:
$crowdedStrings
""";
  }

  Stream<String> sendMessage({
    required String userMessage,
    required List<Map<String, String>> conversationHistory,
    required String liveContext,
  }) async* {
    try {
      final dynamicSystemPrompt = _systemPrompt.replaceAll('{LIVE_CONTEXT}', liveContext);

      // FIX (Category D): GenerativeModel.startChat() takes Content objects.
      // Correctly map conversation history to Content type.
      final history = conversationHistory.take(10).map((msg) =>
        Content(msg['role'] == 'user' ? 'user' : 'model', [TextPart(msg['text']!)])
      ).toList();

      final chat = _model.startChat(history: history);
      final responseStream = chat.sendMessageStream(Content.text(
        "SYSTEM PROMPT OVERRIDE:\n$dynamicSystemPrompt\n\nUSER MESSAGE:\n$userMessage"
      ));

      await for (final chunk in responseStream) {
        if (chunk.text != null) yield chunk.text!;
      }
    } catch (e) {
      // Never expose raw API exceptions to UI
      yield "I'm busy right now due to stadium network conditions, please try again in a moment.";
    }
  }

  String buildPersonalizedContext({
    required List<QueueStatus> nearbyQueues,
    required List<Zone> crowdedZones,
    required String attendeeLocation,
    required AttendeePersonalizationProfile? profile,
  }) {
    // Start with existing generic context
    final baseContext = buildLiveContext(
      nearbyQueues: nearbyQueues,
      crowdedZones: crowdedZones,
      attendeeLocation: attendeeLocation,
      seatLocation: profile?.seatLocation?.displayString,
    );

    // If no profile or no consent: return base context unchanged
    if (profile == null || !profile.consent.locationTracking) {
      return baseContext;
    }

    // Extend with personalization
    final personalizationContext = StringBuffer();

    if (profile.preferences.dietaryRestrictions.isNotEmpty) {
      personalizationContext.writeln(
        "ATTENDEE DIETARY PREFERENCES: "
        "${profile.preferences.dietaryRestrictions.map((d) => d.name).join(', ')}"
      );
    }

    if (profile.seatLocation != null) {
      personalizationContext.writeln(
        "ATTENDEE SEAT: Section ${profile.seatLocation!.section}, "
        "Row ${profile.seatLocation!.row}"
      );
      personalizationContext.writeln(
        "NEAREST EXIT FOR THEIR SEAT: "
        "${profile.seatLocation!.nearestGate}"
      );
    }

    if (profile.preferences.mobilityNeeds != 'STANDARD') {
      personalizationContext.writeln(
        "MOBILITY NEED: ${profile.preferences.mobilityNeeds}"
      );
      personalizationContext.writeln(
        "Always suggest accessible routes. "
        "Avoid stairs. Prefer lifts and ramps."
      );
    }

    if (profile.consent.behavioralSignals &&
        profile.sessionSignals.stallsVisitedThisEvent.isNotEmpty) {
      personalizationContext.writeln(
        "STALLS ALREADY VISITED TODAY: "
        "${profile.sessionSignals.stallsVisitedThisEvent.join(', ')}"
      );
      personalizationContext.writeln(
        "Do NOT recommend these stalls again."
      );
    }

    return '$baseContext\n\nPERSONALIZATION CONTEXT:\n'
           '$personalizationContext';
  }

  String buildBaseCacheKey(String query, String liveContext) {
    return crypto.md5.convert(utf8.encode(query + liveContext)).toString();
  }

  String buildCacheKey(
    String query,
    String liveContext,
    AttendeePersonalizationProfile? profile,
  ) {
    if (profile == null) {
      // Generic query: use base cache key
      return buildBaseCacheKey(query, liveContext);
    }

    // FIX (Category B): Original code had cascade bug:
    //   profile.preferences.dietaryRestrictions.toList()..sort().join(',')
    // The cascade (..) returns List<void> (sort() returns void), so join() was called on void.
    // Fixed by sorting first, then joining on a separate statement.
    final sortedDietary = profile.preferences.dietaryRestrictions
        .map((d) => d.name)
        .toList()
      ..sort();

    final sortedVisited = profile.consent.behavioralSignals
        ? (profile.sessionSignals.stallsVisitedThisEvent.toList()..sort())
        : <String>[];

    final personalFactors = {
      'dietary': sortedDietary.join(','),
      'mobility': profile.preferences.mobilityNeeds,
      'section': profile.seatLocation?.section ?? 'unknown',
      'visited': sortedVisited.join(','),
    };

    final baseKey = buildBaseCacheKey(query, liveContext);
    final personalHash = crypto.md5
      .convert(utf8.encode(json.encode(personalFactors)))
      .toString()
      .substring(0, 8);

    return '${baseKey}_p$personalHash';
  }
}
