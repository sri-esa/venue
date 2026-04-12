// Role: Widget
// Layer: Experience Layer
// Implements: Data Flow Scenario 5 (Graceful Degradation)
import 'package:flutter/material.dart';

class SystemHealthBanner extends StatelessWidget {
  final String healthState;

  const SystemHealthBanner({super.key, required this.healthState});

  @override
  Widget build(BuildContext context) {
    if (healthState == 'HEALTHY' || healthState.isEmpty) {
      return const SizedBox.shrink();
    }

    Color bgColor = Colors.yellow.shade700;
    Color textColor = Colors.black;
    String message = 'Some data may be slightly delayed';
    IconData icon = Icons.warning_amber_rounded;

    if (healthState == 'PARTIAL') {
      bgColor = Colors.orange;
      message = 'Live updates temporarily limited';
    } else if (healthState == 'CRITICAL') {
      bgColor = Colors.red;
      textColor = Colors.white;
      message = 'Limited service mode. Showing last known data.';
      icon = Icons.error_outline;
    }

    return Container(
      width: double.infinity,
      color: bgColor,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: textColor, size: 20),
          const SizedBox(width: 8),
          Text(
            message,
            style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
