// Feature: Queue Monitor
// Layer: Experience Layer
// Implements: Vendor Wait Time Aggregation with real-time updates
// Consumes: FirebaseService watchAllQueues
// Owner: Attendee App Team

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/config/theme.dart';
import '../../../shared/widgets/venue_card.dart';
import '../../../shared/widgets/wait_time_chip.dart';
// TODO(firebase): re-add shimmer_loader.dart when wiring StreamBuilder loading state

class QueueListScreen extends StatefulWidget {
  const QueueListScreen({super.key});

  @override
  State<QueueListScreen> createState() => _QueueListScreenState();
}

class _QueueListScreenState extends State<QueueListScreen> {
  String _activeFilter = 'ALL';
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<_QueueItem> _allQueues = const [
    _QueueItem(
      id: 'q1',
      name: 'Burger Stand A',
      stallType: 'FOOD',
      waitMinutes: 4,
      distanceMeters: 40,
      isOpen: true,
    ),
    _QueueItem(
      id: 'q2',
      name: 'Drinks Kiosk B3',
      stallType: 'DRINKS',
      waitMinutes: 9,
      distanceMeters: 78,
      isOpen: true,
    ),
    _QueueItem(
      id: 'q3',
      name: 'Pizza Express',
      stallType: 'FOOD',
      waitMinutes: 22,
      distanceMeters: 127,
      isOpen: true,
    ),
    _QueueItem(
      id: 'q4',
      name: 'Team Merchandise',
      stallType: 'MERCH',
      waitMinutes: 7,
      distanceMeters: 95,
      isOpen: true,
    ),
    _QueueItem(
      id: 'q5',
      name: 'Restroom — Level 2 North',
      stallType: 'RESTROOM',
      waitMinutes: 3,
      distanceMeters: 52,
      isOpen: true,
    ),
    _QueueItem(
      id: 'q6',
      name: 'Nachos & Snacks',
      stallType: 'FOOD',
      waitMinutes: 12,
      distanceMeters: 113,
      isOpen: true,
    ),
    _QueueItem(
      id: 'q7',
      name: 'Cold Brew Coffee',
      stallType: 'DRINKS',
      waitMinutes: 0,
      distanceMeters: 65,
      isOpen: false,
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<_QueueItem> get _filteredQueues {
    return _allQueues.where((q) {
      final matchesFilter =
          _activeFilter == 'ALL' || q.stallType == _activeFilter;
      final matchesSearch = _searchQuery.isEmpty ||
          q.name.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredQueues;

    return Scaffold(
      backgroundColor: VenueColors.navyDeep,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── HEADER ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(
                VenueSpacing.md, VenueSpacing.md, VenueSpacing.md, 0,
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.chevron_left_rounded,
                      color: VenueColors.textPrimary,
                      size: 28,
                    ),
                    padding: EdgeInsets.zero,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: VenueSpacing.xs),
                  const Text('Queues & Wait Times',
                      style: VenueTextStyles.headlineMedium),
                ],
              ),
            ),

            // ── SEARCH BAR ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(
                VenueSpacing.md, VenueSpacing.md, VenueSpacing.md, 0,
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _searchQuery = v),
                style: VenueTextStyles.bodyLarge,
                decoration: InputDecoration(
                  hintText: 'Search stalls...',
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: VenueColors.textTertiary,
                    size: 20,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(
                            Icons.close_rounded,
                            color: VenueColors.textTertiary,
                            size: 18,
                          ),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : const Icon(
                          Icons.tune_rounded,
                          color: VenueColors.textTertiary,
                          size: 20,
                        ),
                ),
              ),
            ),

            // ── FILTER CHIPS ───────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: VenueSpacing.sm),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: VenueSpacing.md,
                ),
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'All',
                      filterKey: 'ALL',
                      emoji: '🗂️',
                      isActive: _activeFilter == 'ALL',
                      onTap: () => setState(() => _activeFilter = 'ALL'),
                    ),
                    const SizedBox(width: VenueSpacing.xs),
                    _FilterChip(
                      label: 'Food',
                      filterKey: 'FOOD',
                      emoji: '🍔',
                      isActive: _activeFilter == 'FOOD',
                      onTap: () => setState(() => _activeFilter = 'FOOD'),
                    ),
                    const SizedBox(width: VenueSpacing.xs),
                    _FilterChip(
                      label: 'Drinks',
                      filterKey: 'DRINKS',
                      emoji: '🥤',
                      isActive: _activeFilter == 'DRINKS',
                      onTap: () => setState(() => _activeFilter = 'DRINKS'),
                    ),
                    const SizedBox(width: VenueSpacing.xs),
                    _FilterChip(
                      label: 'Merch',
                      filterKey: 'MERCH',
                      emoji: '👕',
                      isActive: _activeFilter == 'MERCH',
                      onTap: () => setState(() => _activeFilter = 'MERCH'),
                    ),
                    const SizedBox(width: VenueSpacing.xs),
                    _FilterChip(
                      label: 'Restroom',
                      filterKey: 'RESTROOM',
                      emoji: '🚻',
                      isActive: _activeFilter == 'RESTROOM',
                      onTap: () =>
                          setState(() => _activeFilter = 'RESTROOM'),
                    ),
                  ],
                ),
              ),
            ),

            // ── SORT LABEL ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(
                VenueSpacing.md, VenueSpacing.sm, VenueSpacing.md, 0,
              ),
              child: Row(
                children: [
                  Text(
                    '${filtered.length} stalls',
                    style: VenueTextStyles.labelSmall,
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.swap_vert_rounded,
                    size: 14,
                    color: VenueColors.electricBlue,
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'Nearest first',
                    style: TextStyle(
                      fontSize: 12,
                      color: VenueColors.electricBlue,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: VenueSpacing.md),

            // ── QUEUE LIST ─────────────────────────────────────────────
            Expanded(
              child: filtered.isEmpty
                  ? _EmptyState(
                      onReset: () => setState(() {
                        _activeFilter = 'ALL';
                        _searchController.clear();
                        _searchQuery = '';
                      }),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(
                        horizontal: VenueSpacing.md,
                        vertical: VenueSpacing.sm,
                      ),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: VenueSpacing.sm),
                      itemBuilder: (context, index) {
                        final q = filtered[index];
                        return _QueueCard(
                          item: q,
                          onNavigate: () => context.goNamed('ar_navigation'),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── DATA MODEL (local mock) ───────────────────────────────────────────────────
class _QueueItem {
  final String id;
  final String name;
  final String stallType;
  final int waitMinutes;
  final int distanceMeters;
  final bool isOpen;

  const _QueueItem({
    required this.id,
    required this.name,
    required this.stallType,
    required this.waitMinutes,
    required this.distanceMeters,
    required this.isOpen,
  });
}

// ── FILTER CHIP ───────────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final String filterKey;
  final String emoji;
  final bool isActive;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.filterKey,
    required this.emoji,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          horizontal: VenueSpacing.md,
          vertical: VenueSpacing.xs + 2,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? VenueColors.electricBlue.withAlpha(51)
              : VenueColors.navyElevated,
          borderRadius: BorderRadius.circular(VenueRadius.full),
          border: Border.all(
            color: isActive
                ? VenueColors.electricBlue
                : VenueColors.navyBorder,
            width: 1,
          ),
        ),
        child: Text(
          '$emoji $label',
          style: TextStyle(
            fontSize: 13,
            color: isActive
                ? VenueColors.electricBlueLight
                : VenueColors.textSecondary,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

// ── QUEUE CARD ─────────────────────────────────────────────────────────────────
class _QueueCard extends StatelessWidget {
  final _QueueItem item;
  final VoidCallback onNavigate;

  const _QueueCard({required this.item, required this.onNavigate});

  IconData get _icon {
    switch (item.stallType) {
      case 'FOOD':
        return Icons.fastfood_rounded;
      case 'DRINKS':
        return Icons.local_drink_rounded;
      case 'MERCH':
        return Icons.shopping_bag_rounded;
      case 'RESTROOM':
        return Icons.wc_rounded;
      default:
        return Icons.store_rounded;
    }
  }

  Color get _iconColor {
    switch (item.stallType) {
      case 'FOOD':
        return VenueColors.densityMedium;
      case 'DRINKS':
        return VenueColors.electricBlue;
      case 'MERCH':
        return const Color(0xFFA855F7);
      case 'RESTROOM':
        return const Color(0xFF06B6D4);
      default:
        return VenueColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return VenueCard(
      onTap: onNavigate,
      padding: const EdgeInsets.symmetric(
        horizontal: VenueSpacing.md,
        vertical: VenueSpacing.sm + 2,
      ),
      child: Row(
        children: [
          // Type icon
          Container(
            padding: const EdgeInsets.all(VenueSpacing.sm),
            decoration: BoxDecoration(
              color: _iconColor.withAlpha(26),
              borderRadius: BorderRadius.circular(VenueRadius.md),
            ),
            child: Icon(_icon, size: 20, color: _iconColor),
          ),

          const SizedBox(width: VenueSpacing.md),

          // Name + distance
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: VenueTextStyles.labelLarge,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${item.distanceMeters}m away',
                  style: VenueTextStyles.bodyMedium,
                ),
              ],
            ),
          ),

          // Wait time chip + navigate arrow
          WaitTimeChip(
            minutes: item.waitMinutes,
            isClosed: !item.isOpen,
          ),
          const SizedBox(width: VenueSpacing.sm),
          const Icon(
            Icons.navigation_rounded,
            color: VenueColors.electricBlue,
            size: 18,
          ),
        ],
      ),
    );
  }
}

// ── EMPTY STATE ─────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final VoidCallback onReset;

  const _EmptyState({required this.onReset});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(VenueSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(VenueSpacing.xl),
              decoration: BoxDecoration(
                color: VenueColors.navyCard,
                shape: BoxShape.circle,
                border: Border.all(color: VenueColors.navyBorder, width: 1),
              ),
              child: const Icon(
                Icons.search_off_rounded,
                size: 48,
                color: VenueColors.textTertiary,
              ),
            ),
            const SizedBox(height: VenueSpacing.lg),
            const Text(
              'All Clear',
              style: VenueTextStyles.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: VenueSpacing.sm),
            const Text(
              'No stalls match your current filter.',
              style: VenueTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: VenueSpacing.lg),
            ElevatedButton(
              onPressed: onReset,
              child: const Text('Show all stalls'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── FIREBASE STREAM INTEGRATION NOTE ─────────────────────────────────────────
// When wiring real Firebase data, replace the mock ListView.builder with:
//
// StreamBuilder<List<QueueStatus>>(
//   stream: ref.watch(allQueuesProvider.stream),
//   builder: (ctx, snap) {
//     if (snap.connectionState == ConnectionState.waiting) {
//       // Shimmer loading: show 6 skeleton cards
//       return ListView.separated(
//         padding: const EdgeInsets.all(VenueSpacing.md),
//         itemCount: 6,
//         separatorBuilder: (_, __) => const SizedBox(height: VenueSpacing.sm),
//         itemBuilder: (_, __) => const ShimmerCard(),
//       );
//     }
//     if (snap.hasError) return _ErrorState(error: snap.error.toString());
//     final queues = snap.data ?? [];
//     if (queues.isEmpty) return _EmptyState(onReset: _resetFilters);
//     return ListView.builder(itemCount: queues.length, ...);
//   },
// )
