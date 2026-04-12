// Feature: Home Dashboard
// Layer: Experience Layer
// Implements: Live venue overview — primary landing screen
// Owner: Attendee App Team

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/config/theme.dart';
import '../../../shared/widgets/live_badge.dart';
import '../../../shared/widgets/metric_card.dart';
import '../../../shared/widgets/section_header.dart';
import '../../../shared/widgets/venue_card.dart';
import '../../../shared/widgets/wait_time_chip.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VenueColors.navyDeep,
      body: CustomScrollView(
        slivers: [
          // ── COLLAPSING HERO APP BAR ──────────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: VenueColors.navyDeep,
            surfaceTintColor: Colors.transparent,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: _HeroSection(),
              titlePadding: EdgeInsets.zero,
              title: const _PinnedAppBar(),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(0),
              child: Container(
                height: 1,
                color: VenueColors.navyBorder,
              ),
            ),
          ),

          // ── METRICS ROW ─────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'Venue Status',
                  trailing: LiveBadge(size: LiveBadgeSize.sm),
                ),
                SizedBox(
                  height: 120, // INCREASED to fix RenderFlex overflow in MetricCard
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: VenueSpacing.md,
                    ),
                    children: [
                      MetricCard(
                        label: 'Capacity',
                        value: '98%',
                        subtitle: '49,201 / 50,000',
                        valueColor: VenueColors.densityCritical,
                        leading: const Icon(
                          Icons.people_alt_rounded,
                          size: 14,
                          color: VenueColors.textTertiary,
                        ),
                        onTap: () {},
                      ),
                      const SizedBox(width: VenueSpacing.sm),
                      MetricCard(
                        label: 'Nearest Queue',
                        value: '4 min',
                        subtitle: 'Burger Stand A · 40m',
                        valueColor: VenueColors.densityLow,
                        leading: const Icon(
                          Icons.fastfood_rounded,
                          size: 14,
                          color: VenueColors.textTertiary,
                        ),
                        onTap: () => context.goNamed('queues'),
                      ),
                      const SizedBox(width: VenueSpacing.sm),
                      MetricCard(
                        label: 'Your Zone',
                        value: 'OK',
                        subtitle: 'Section 12 — Low',
                        valueColor: VenueColors.densityLow,
                        leading: const Icon(
                          Icons.stadium_rounded,
                          size: 14,
                          color: VenueColors.textTertiary,
                        ),
                        onTap: () {},
                      ),
                      const SizedBox(width: VenueSpacing.sm),
                      MetricCard(
                        label: 'Active Alerts',
                        value: '2',
                        subtitle: 'Gate 7 congested',
                        valueColor: VenueColors.densityMedium,
                        leading: const Icon(
                          Icons.notifications_rounded,
                          size: 14,
                          color: VenueColors.textTertiary,
                        ),
                        onTap: () {},
                      ),
                      const SizedBox(width: VenueSpacing.md),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── SEAT INFO ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: VenueSpacing.md),
              child: VenueCard(
                gradient: VenueColors.heroGradient,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(VenueSpacing.sm),
                      decoration: BoxDecoration(
                        color: VenueColors.electricBlue.withAlpha(51),
                        borderRadius: BorderRadius.circular(VenueRadius.md),
                      ),
                      child: const Icon(
                        Icons.event_seat_rounded,
                        color: VenueColors.electricBlue,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: VenueSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Section 12, Row G, Seat 14',
                            style: VenueTextStyles.labelLarge,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Gate North-C · Food Zone 08',
                            style: VenueTextStyles.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: VenueColors.electricBlue,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── QUICK ACTIONS ────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(title: 'Quick Actions'),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: VenueSpacing.md,
                  ),
                  child: GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: VenueSpacing.sm,
                    mainAxisSpacing: VenueSpacing.sm,
                    childAspectRatio: 2.2,
                    children: [
                      _QuickActionButton(
                        icon: Icons.navigation_rounded,
                        label: 'Navigate',
                        onTap: () => context.goNamed('ar_navigation'),
                      ),
                      _QuickActionButton(
                        icon: Icons.auto_awesome_rounded,
                        label: 'VenueAI',
                        onTap: () => context.goNamed('assistant'),
                        isHighlighted: true,
                      ),
                      _QuickActionButton(
                        icon: Icons.fastfood_rounded,
                        label: 'Find Food',
                        onTap: () => context.goNamed('queues'),
                      ),
                      _QuickActionButton(
                        icon: Icons.exit_to_app_rounded,
                        label: 'Exit Routes',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── ACTIVE ALERTS ────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'Active Alerts',
                  trailing: Padding(
                    padding: EdgeInsets.only(right: VenueSpacing.md),
                    child: Text(
                      'See all',
                      style: TextStyle(
                        fontSize: 12,
                        color: VenueColors.electricBlue,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  height: 125, // INCREASED slightly more for safety
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: VenueSpacing.md,
                    ),
                    children: [
                      _AlertCard(
                        priority: 'P1',
                        zone: 'Gate 7 — North Entry',
                        message: 'High congestion — use Gate 8 as alternate.',
                        timeAgo: '3 min ago',
                        isHighPriority: true,
                      ),
                      const SizedBox(width: VenueSpacing.sm),
                      _AlertCard(
                        priority: 'P2',
                        zone: 'Food Court A',
                        message: 'Wait times elevated. Burger Stand A: 22 min.',
                        timeAgo: '8 min ago',
                        isHighPriority: false,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── NEAREST QUEUES ───────────────────────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionHeader(
                  title: 'Nearest Queues',
                  trailing: TextButton(
                    onPressed: () => context.goNamed('queues'),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: VenueSpacing.md,
                      ),
                    ),
                    child: const Text('See all'),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: VenueSpacing.md,
                  ),
                  child: Column(
                    children: [
                      _QueuePreviewCard(
                        name: 'Burger Stand A',
                        distance: '40m away',
                        waitMinutes: 4,
                        type: 'FOOD',
                        onNavigate: () => context.goNamed('ar_navigation'),
                      ),
                      const SizedBox(height: VenueSpacing.sm),
                      _QueuePreviewCard(
                        name: 'Drinks Kiosk B3',
                        distance: '78m away',
                        waitMinutes: 9,
                        type: 'DRINKS',
                        onNavigate: () => context.goNamed('ar_navigation'),
                      ),
                      const SizedBox(height: VenueSpacing.sm),
                      _QueuePreviewCard(
                        name: 'Pizza Express',
                        distance: '127m away',
                        waitMinutes: 22,
                        type: 'FOOD',
                        onNavigate: () => context.goNamed('ar_navigation'),
                      ),
                      const SizedBox(height: VenueSpacing.xxl),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: const _VenueBottomNav(),
    );
  }
}

// ── HERO SECTION ──────────────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: VenueColors.heroGradient),
      padding: const EdgeInsets.fromLTRB(
        VenueSpacing.md, 60, VenueSpacing.md, VenueSpacing.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Apex Stadium',
                  style: VenueTextStyles.headlineLarge.copyWith(
                    fontSize: 28,
                    letterSpacing: -0.8,
                  ),
                ),
              ),
              const LiveBadge(),
            ],
          ),
          const SizedBox(height: VenueSpacing.xs),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: VenueSpacing.sm,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: VenueColors.electricBlue.withAlpha(51),
                  borderRadius: BorderRadius.circular(VenueRadius.full),
                  border: Border.all(
                    color: VenueColors.electricBlue.withAlpha(128),
                    width: 1,
                  ),
                ),
                child: const Text(
                  'Champions Cup 2026',
                  style: VenueTextStyles.labelMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: VenueSpacing.md),
          // Attendance meter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '49,201',
                style: VenueTextStyles.monoLarge.copyWith(fontSize: 36),
              ),
              Text(
                '/ 50,000',
                style: VenueTextStyles.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: VenueSpacing.xs),
          // Capacity progress bar — red at 98%
          ClipRRect(
            borderRadius: BorderRadius.circular(VenueRadius.full),
            child: LinearProgressIndicator(
              value: 0.98,
              backgroundColor: VenueColors.navyBorder,
              valueColor: const AlwaysStoppedAnimation<Color>(
                VenueColors.densityCritical,
              ),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            '98% capacity',
            style: VenueTextStyles.labelSmall,
          ),
        ],
      ),
    );
  }
}

// ── PINNED APP BAR (collapsed state) ─────────────────────────────────────────
class _PinnedAppBar extends StatelessWidget {
  const _PinnedAppBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: VenueColors.navyDeep,
      padding: EdgeInsets.only(
        left: VenueSpacing.md,
        right: VenueSpacing.md,
        top: MediaQuery.of(context).padding.top,
        bottom: VenueSpacing.sm,
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Apex Stadium',
              style: VenueTextStyles.headlineMedium,
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.notifications_outlined,
              color: VenueColors.textPrimary,
            ),
            onPressed: () {},
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: VenueSpacing.xs),
          IconButton(
            icon: const Icon(
              Icons.settings_outlined,
              color: VenueColors.textPrimary,
            ),
            onPressed: () => context.go('/preferences'),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}

// ── QUICK ACTION BUTTON ───────────────────────────────────────────────────────
class _QuickActionButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isHighlighted;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isHighlighted = false,
  });

  @override
  State<_QuickActionButton> createState() => _QuickActionButtonState();
}

class _QuickActionButtonState extends State<_QuickActionButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ac;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ac = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _ac, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => _ac.forward(),
      onTapUp: (_) => _ac.reverse(),
      onTapCancel: () => _ac.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: VenueSpacing.sm,
            vertical: VenueSpacing.sm,
          ),
          decoration: BoxDecoration(
            gradient: widget.isHighlighted
                ? VenueColors.blueAccentGradient
                : null,
            color: widget.isHighlighted ? null : VenueColors.navyElevated,
            borderRadius: BorderRadius.circular(VenueRadius.lg),
            border: Border.all(
              color: widget.isHighlighted
                  ? VenueColors.electricBlue
                  : VenueColors.navyBorder,
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                widget.icon,
                size: 22,
                color: widget.isHighlighted
                    ? Colors.white
                    : VenueColors.electricBlue,
              ),
              const SizedBox(width: VenueSpacing.sm),
              Flexible(
                child: Text(
                  widget.label,
                  style: VenueTextStyles.labelLarge.copyWith(
                    fontSize: 13,
                    color: Colors.white,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── ALERT CARD (horizontal scroll) ───────────────────────────────────────────
class _AlertCard extends StatelessWidget {
  final String priority;
  final String zone;
  final String message;
  final String timeAgo;
  final bool isHighPriority;

  const _AlertCard({
    required this.priority,
    required this.zone,
    required this.message,
    required this.timeAgo,
    required this.isHighPriority,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor =
        isHighPriority ? VenueColors.densityMedium : VenueColors.navyBorder;

    return SizedBox(
      width: 260,
      child: Container(
        padding: const EdgeInsets.all(VenueSpacing.md),
        decoration: BoxDecoration(
          color: VenueColors.navyCard,
          borderRadius: BorderRadius.circular(VenueRadius.lg),
          border: Border.all(
            color: isHighPriority ? borderColor : VenueColors.navyBorder,
            width: isHighPriority ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: borderColor.withAlpha(51),
                    borderRadius: BorderRadius.circular(VenueRadius.sm),
                  ),
                  child: Text(
                    priority,
                    style: VenueTextStyles.labelSmall.copyWith(
                      color: borderColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Spacer(),
                Text(timeAgo, style: VenueTextStyles.labelSmall),
              ],
            ),
            const SizedBox(height: VenueSpacing.xs),
            Text(zone, style: VenueTextStyles.labelLarge),
            const SizedBox(height: 2),
            Text(
              message,
              style: VenueTextStyles.bodyMedium,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ── QUEUE PREVIEW CARD ────────────────────────────────────────────────────────
class _QueuePreviewCard extends StatelessWidget {
  final String name;
  final String distance;
  final int waitMinutes;
  final String type;
  final VoidCallback onNavigate;

  const _QueuePreviewCard({
    required this.name,
    required this.distance,
    required this.waitMinutes,
    required this.type,
    required this.onNavigate,
  });

  IconData get _typeIcon {
    switch (type) {
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

  Color get _typeColor {
    switch (type) {
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
      padding: const EdgeInsets.symmetric(
        horizontal: VenueSpacing.md,
        vertical: VenueSpacing.sm,
      ),
      onTap: onNavigate,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(VenueSpacing.sm),
            decoration: BoxDecoration(
              color: _typeColor.withAlpha(26),
              borderRadius: BorderRadius.circular(VenueRadius.md),
            ),
            child: Icon(_typeIcon, size: 20, color: _typeColor),
          ),
          const SizedBox(width: VenueSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: VenueTextStyles.labelLarge),
                const SizedBox(height: 2),
                Text(distance, style: VenueTextStyles.bodyMedium),
              ],
            ),
          ),
          WaitTimeChip(minutes: waitMinutes),
          const SizedBox(width: VenueSpacing.sm),
          const Icon(
            Icons.chevron_right_rounded,
            color: VenueColors.electricBlue,
            size: 20,
          ),
        ],
      ),
    );
  }
}

// ── BOTTOM NAVIGATION ─────────────────────────────────────────────────────────
class _VenueBottomNav extends StatelessWidget {
  const _VenueBottomNav();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 65,
      decoration: const BoxDecoration(
        color: VenueColors.navyCard,
        border: Border(
          top: BorderSide(color: VenueColors.navyBorder, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(
            icon: Icons.home_rounded,
            label: 'Home',
            isActive: true,
            onTap: () {},
          ),
          _NavItem(
            icon: Icons.map_rounded,
            label: 'Map',
            onTap: () => context.goNamed('ar_navigation'),
          ),
          // Center AI tab — elevated, highlighted
          _NavItemCenter(
            onTap: () => context.goNamed('assistant'),
          ),
          _NavItem(
            icon: Icons.fastfood_rounded,
            label: 'Queues',
            onTap: () => context.goNamed('queues'),
          ),
          _NavItem(
            icon: Icons.notifications_rounded,
            label: 'Alerts',
            badgeCount: 2,
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final int? badgeCount;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isActive = false,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    final color =
        isActive ? VenueColors.electricBlue : VenueColors.textTertiary;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 56,
        child: Stack(
          alignment: Alignment.topCenter,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 22, color: color),
                if (isActive) ...[
                  const SizedBox(height: 3),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 10,
                      color: color,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
            if (badgeCount != null && badgeCount! > 0)
              Positioned(
                top: 10,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: VenueColors.densityCritical,
                    borderRadius: BorderRadius.circular(VenueRadius.full),
                  ),
                  child: Text(
                    '$badgeCount',
                    style: const TextStyle(
                      fontSize: 9,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NavItemCenter extends StatelessWidget {
  final VoidCallback onTap;

  const _NavItemCenter({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 46,
        decoration: BoxDecoration(
          gradient: VenueColors.blueAccentGradient,
          borderRadius: BorderRadius.circular(VenueRadius.lg),
          boxShadow: [
            BoxShadow(
              color: VenueColors.electricBlue.withAlpha(77),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(
          Icons.auto_awesome_rounded,
          color: Colors.white,
          size: 22,
        ),
      ),
    );
  }
}
