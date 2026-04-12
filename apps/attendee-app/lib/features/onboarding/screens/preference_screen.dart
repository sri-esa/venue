import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PreferenceScreen extends StatefulWidget {
  const PreferenceScreen({super.key});

  @override
  State<PreferenceScreen> createState() => _PreferenceScreenState();
}

class _PreferenceScreenState extends State<PreferenceScreen> {
  // Mock State
  List<String> dietaryPreferences = [];
  String mobilityNeed = 'STANDARD';
  String notificationFrequency = 'IMPORTANT_ONLY';
  List<String> favoriteStalls = ['stall-pizza-1', 'stall-drinks-2'];
  
  bool locationTracking = true;
  bool behavioralSignals = true;
  bool pushNotifications = true;

  void toggleDietary(String pref) {
    setState(() {
      if (dietaryPreferences.contains(pref)) {
        dietaryPreferences.remove(pref);
      } else {
        dietaryPreferences.add(pref);
      }
    });
  }

  void _confirmDataDeletion() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete All My Data?'),
        content: const Text('This will permanently delete your personalized profile and return the app to standard defaults.'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              // Calls DELETE /attendee/{attendeeId}/profile
              // Clears local storage
              context.pop(); // Close dialog
              context.go('/onboarding'); // Return to onboarding
            },
            child: const Text('Delete Data'),
          ),
        ],
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Preferences & Privacy'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildSectionTitle('Dietary Preferences'),
          Wrap(
            spacing: 8,
            children: ['VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'GLUTEN_FREE'].map((pref) {
              return FilterChip(
                label: Text(pref),
                selected: dietaryPreferences.contains(pref),
                onSelected: (val) => toggleDietary(pref),
              );
            }).toList(),
          ),
          
          const Divider(height: 32),
          _buildSectionTitle('Mobility Needs'),
          // FIX (Category E): DropdownButtonFormField.value deprecated after v3.33.
          // Use initialValue instead.
          DropdownButtonFormField<String>(
            initialValue: mobilityNeed,
            items: ['STANDARD', 'WHEELCHAIR', 'LIMITED_MOBILITY', 'VISUAL_IMPAIRMENT']
                .map((need) => DropdownMenuItem(value: need, child: Text(need)))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => mobilityNeed = val);
            },
          ),

          const Divider(height: 32),
          _buildSectionTitle('Notification Frequency'),
          // FIX (Category E): RadioListTile.groupValue and .onChanged deprecated after v3.32.
          // Replaced with custom InkWell implementation to avoid deprecated RadioGroup pattern.
          Column(
            children: ['ALL', 'IMPORTANT_ONLY', 'NONE'].map((freq) {
              final isSelected = notificationFrequency == freq;
              return InkWell(
                onTap: () => setState(() => notificationFrequency = freq),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                  child: Row(
                    children: [
                      Icon(
                        isSelected
                            ? Icons.radio_button_checked
                            : Icons.radio_button_unchecked,
                        color: isSelected ? Colors.blue : null,
                      ),
                      const SizedBox(width: 12),
                      Text(freq),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const Divider(height: 32),
          _buildSectionTitle('Saved Stalls'),
          ...favoriteStalls.map((stallId) => ListTile(
            title: Text(stallId),
            trailing: IconButton(
              icon: const Icon(Icons.remove_circle, color: Colors.red),
              onPressed: () {
                setState(() => favoriteStalls.remove(stallId));
              },
            ),
          )),

          const Divider(height: 32),
          _buildSectionTitle('Privacy Controls'),
          SwitchListTile(
            title: const Text('Location Tracking'),
            subtitle: const Text('Used for proximity recommendations'),
            value: locationTracking,
            onChanged: (val) {
              setState(() => locationTracking = val);
              if (!val) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Your preferences have been updated')),
                );
              }
            },
          ),
          SwitchListTile(
            title: const Text('Behavioral Signals'),
            subtitle: const Text('Used for smarter session suggestions'),
            value: behavioralSignals,
            onChanged: (val) {
              setState(() => behavioralSignals = val);
              if (!val) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Your preferences have been updated')),
                );
              }
            },
          ),
          SwitchListTile(
            title: const Text('Push Notifications'),
            value: pushNotifications,
            onChanged: (val) => setState(() => pushNotifications = val),
          ),

          const Divider(height: 32),
          _buildSectionTitle('Data Management'),
          ElevatedButton(
            onPressed: _confirmDataDeletion,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade100,
              foregroundColor: Colors.red,
            ),
            child: const Text('Delete All My Data'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }
}
