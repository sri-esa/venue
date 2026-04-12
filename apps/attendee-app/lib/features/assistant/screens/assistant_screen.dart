// Feature: Gemini AI Concierge
// Layer: Experience Layer
// Implements: Chat Interface — premium conversational assistant
// Consumes: GeminiService
// Owner: Attendee App Team

import 'package:flutter/material.dart';
import '../../../core/config/theme.dart';
import '../../../shared/widgets/live_badge.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen>
    with TickerProviderStateMixin {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];
  bool _isStreaming = false;

  // Suggestion chips for empty state
  static const List<_Suggestion> _suggestions = [
    _Suggestion(emoji: '🍔', text: 'Shortest food queue'),
    _Suggestion(emoji: '🚻', text: 'Nearest restroom'),
    _Suggestion(emoji: '🅿️', text: 'Exit routes'),
    _Suggestion(emoji: '♿', text: 'Accessible paths'),
    _Suggestion(emoji: '⏱️', text: 'Current wait times'),
    _Suggestion(emoji: '📍', text: 'Where am I?'),
  ];

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true));
      _isStreaming = true;
    });

    _inputController.clear();
    _scrollToBottom();

    // Simulate streaming response after a brief delay
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      setState(() {
        _isStreaming = false;
        _messages.add(_ChatMessage(
          text:
              "Food Court A currently has the shortest queues. Burger Stand A has only a 4-minute wait and is just 40 meters from Gate C — head left after the turnstile.",
          isUser: false,
        ));
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VenueColors.navyDeep,
      body: SafeArea(
        child: Column(
          children: [
            // ── HEADER ──────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(
                VenueSpacing.md, VenueSpacing.md, VenueSpacing.md, VenueSpacing.sm,
              ),
              decoration: const BoxDecoration(
                color: VenueColors.navyDeep,
                border: Border(
                  bottom: BorderSide(color: VenueColors.navyBorder, width: 1),
                ),
              ),
              child: Row(
                children: [
                  // AI Avatar
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: VenueColors.blueAccentGradient,
                      borderRadius: BorderRadius.circular(VenueRadius.md),
                    ),
                    child: const Icon(
                      Icons.auto_awesome_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: VenueSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'VenueAI',
                          style: VenueTextStyles.headlineMedium,
                        ),
                        Text(
                          'Powered by Gemini · Live venue data',
                          style: VenueTextStyles.labelSmall.copyWith(
                            color: VenueColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const LiveBadge(size: LiveBadgeSize.sm),
                  const SizedBox(width: VenueSpacing.sm),
                  IconButton(
                    icon: const Icon(
                      Icons.refresh_rounded,
                      color: VenueColors.textSecondary,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _messages.clear()),
                    padding: EdgeInsets.zero,
                    tooltip: 'Clear conversation',
                  ),
                ],
              ),
            ),

            // ── CHAT AREA ────────────────────────────────────────────────
            Expanded(
              child: _messages.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(
                        horizontal: VenueSpacing.md,
                        vertical: VenueSpacing.md,
                      ),
                      itemCount: _messages.length + (_isStreaming ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _messages.length && _isStreaming) {
                          return const _StreamingIndicator();
                        }
                        final msg = _messages[index];
                        return msg.isUser
                            ? _UserBubble(text: msg.text)
                            : _AiBubble(text: msg.text);
                      },
                    ),
            ),

            // ── INPUT BAR ────────────────────────────────────────────────
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(VenueSpacing.md),
      child: Column(
        children: [
          const SizedBox(height: VenueSpacing.xl),

          // Welcome illustration
          Container(
            padding: const EdgeInsets.all(VenueSpacing.xl),
            decoration: BoxDecoration(
              gradient: VenueColors.heroGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              size: 48,
              color: Colors.white,
            ),
          ),

          const SizedBox(height: VenueSpacing.lg),
          const Text(
            "I'm VenueAI",
            style: VenueTextStyles.headlineLarge,
          ),
          const SizedBox(height: VenueSpacing.sm),
          Text(
            "Your smart stadium concierge.\nAsk me anything about the venue.",
            style: VenueTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: VenueSpacing.xl),

          // Suggestion chips grid
          Wrap(
            spacing: VenueSpacing.sm,
            runSpacing: VenueSpacing.sm,
            alignment: WrapAlignment.center,
            children: _suggestions.map((s) {
              return GestureDetector(
                onTap: () => _sendMessage('${s.emoji} ${s.text}'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: VenueSpacing.md,
                    vertical: VenueSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: VenueColors.navyElevated,
                    borderRadius: BorderRadius.circular(VenueRadius.full),
                    border: Border.all(
                      color: VenueColors.navyBorder,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(s.emoji, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 6),
                      Text(s.text, style: VenueTextStyles.labelMedium),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        VenueSpacing.md, VenueSpacing.sm, VenueSpacing.sm, VenueSpacing.md,
      ),
      decoration: const BoxDecoration(
        color: VenueColors.navyCard,
        border: Border(
          top: BorderSide(color: VenueColors.navyBorder, width: 1),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _inputController,
              style: VenueTextStyles.bodyLarge,
              minLines: 1,
              maxLines: 3,
              textInputAction: TextInputAction.send,
              onSubmitted: _sendMessage,
              decoration: const InputDecoration(
                hintText: 'Ask about the venue...',
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: VenueSpacing.sm,
                  vertical: VenueSpacing.sm,
                ),
              ),
            ),
          ),
          // Microphone button
          IconButton(
            icon: const Icon(
              Icons.mic_rounded,
              color: VenueColors.textSecondary,
              size: 22,
            ),
            onPressed: () {}, // Voice input — future implementation
          ),
          // Send button
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: _inputController,
            builder: (context, value, _) {
              final hasText = value.text.trim().isNotEmpty;
              return GestureDetector(
                onTap: hasText ? () => _sendMessage(_inputController.text) : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: hasText
                        ? VenueColors.electricBlue
                        : VenueColors.navyBorder,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_upward_rounded,
                    color: hasText ? Colors.white : VenueColors.textDisabled,
                    size: 18,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ── DATA MODELS ────────────────────────────────────────────────────────────────
class _ChatMessage {
  final String text;
  final bool isUser;
  _ChatMessage({required this.text, required this.isUser});
}

class _Suggestion {
  final String emoji;
  final String text;
  const _Suggestion({required this.emoji, required this.text});
}

// ── USER BUBBLE ───────────────────────────────────────────────────────────────
class _UserBubble extends StatelessWidget {
  final String text;
  const _UserBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(
          bottom: VenueSpacing.md,
          left: 60,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: VenueSpacing.md,
          vertical: VenueSpacing.sm + 2,
        ),
        decoration: const BoxDecoration(
          color: VenueColors.electricBlue,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(VenueRadius.lg),
            topRight: Radius.circular(VenueRadius.lg),
            bottomLeft: Radius.circular(VenueRadius.lg),
            bottomRight: Radius.circular(4),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 15,
            color: Colors.white,
            fontWeight: FontWeight.w400,
            height: 1.4,
          ),
        ),
      ),
    );
  }
}

// ── AI BUBBLE ─────────────────────────────────────────────────────────────────
class _AiBubble extends StatelessWidget {
  final String text;
  const _AiBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // AI avatar
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              gradient: VenueColors.blueAccentGradient,
              borderRadius: BorderRadius.circular(VenueRadius.md),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Colors.white,
              size: 14,
            ),
          ),
          const SizedBox(width: VenueSpacing.sm),
          // Message bubble
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(
                bottom: VenueSpacing.md,
                right: 60,
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: VenueSpacing.md,
                vertical: VenueSpacing.sm + 2,
              ),
              decoration: BoxDecoration(
                color: VenueColors.navyElevated,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(VenueRadius.lg),
                  bottomLeft: Radius.circular(VenueRadius.lg),
                  bottomRight: Radius.circular(VenueRadius.lg),
                ),
                border: Border.all(
                  color: VenueColors.navyBorder,
                  width: 1,
                ),
              ),
              child: Text(
                text,
                style: const TextStyle(
                  fontSize: 15,
                  color: VenueColors.textPrimary,
                  fontWeight: FontWeight.w400,
                  height: 1.4,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── STREAMING INDICATOR (3 bouncing dots) ─────────────────────────────────────
class _StreamingIndicator extends StatefulWidget {
  const _StreamingIndicator();

  @override
  State<_StreamingIndicator> createState() => _StreamingIndicatorState();
}

class _StreamingIndicatorState extends State<_StreamingIndicator>
    with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;
  late final List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(3, (i) {
      final ac = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 500),
      );
      // Stagger: 200ms per dot
      Future.delayed(Duration(milliseconds: i * 200), () {
        if (mounted) ac.repeat(reverse: true);
      });
      return ac;
    });

    _animations = _controllers.map((ac) {
      return Tween<double>(begin: 0.0, end: -8.0).animate(
        CurvedAnimation(parent: ac, curve: Curves.easeInOut),
      );
    }).toList();
  }

  @override
  void dispose() {
    for (final ac in _controllers) {
      ac.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 30,
            height: 30,
            margin: const EdgeInsets.only(bottom: VenueSpacing.md),
            decoration: BoxDecoration(
              gradient: VenueColors.blueAccentGradient,
              borderRadius: BorderRadius.circular(VenueRadius.md),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Colors.white,
              size: 14,
            ),
          ),
          const SizedBox(width: VenueSpacing.sm),
          Container(
            margin: const EdgeInsets.only(bottom: VenueSpacing.md),
            padding: const EdgeInsets.symmetric(
              horizontal: VenueSpacing.md,
              vertical: VenueSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: VenueColors.navyElevated,
              borderRadius: BorderRadius.circular(VenueRadius.lg),
              border: Border.all(color: VenueColors.navyBorder, width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                return AnimatedBuilder(
                  animation: _animations[i],
                  builder: (context, _) {
                    return Transform.translate(
                      offset: Offset(0, _animations[i].value),
                      child: Container(
                        width: 7,
                        height: 7,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: const BoxDecoration(
                          color: VenueColors.electricBlue,
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  },
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
