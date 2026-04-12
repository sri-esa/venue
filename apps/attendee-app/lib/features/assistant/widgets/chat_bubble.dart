import 'package:flutter/material.dart';

// D3 - Gemini Streaming Render Optimization
class StreamingChatBubble extends StatefulWidget {
  final Stream<String> tokenStream;
  const StreamingChatBubble({required this.tokenStream, super.key});
  
  @override
  State<StreamingChatBubble> createState() => _StreamingChatBubbleState();
}

class _StreamingChatBubbleState extends State<StreamingChatBubble> {
  final _textController = ValueNotifier<String>('');
  
  @override
  void initState() {
    super.initState();
    widget.tokenStream.listen((token) {
      _textController.value += token;
      // ValueNotifier only rebuilds ValueListenableBuilder
      // NOT the entire widget tree
    });
  }
  
  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: _textController,
      builder: (context, text, _) => Text(text),
    );
  }
}
