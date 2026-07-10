// mobile/lib/screens/advisory_screen.dart
//
// AdvisoryScreen — farmer advisory cards with urgency colour coding,
// filtering, and acknowledge/dismiss actions.

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../models/models.dart';

class AdvisoryScreen extends StatefulWidget {
  const AdvisoryScreen({super.key});
  @override
  State<AdvisoryScreen> createState() => _AdvisoryScreenState();
}

class _AdvisoryScreenState extends State<AdvisoryScreen>
    with SingleTickerProviderStateMixin {

  static const _bg     = Color(0xFF0D1208);
  static const _green2 = Color(0xFF9FD468);
  static const _txt    = Color(0xFFE8F0D8);
  static const _txt3   = Color(0xFF6A7A58);

  late TabController _tabs;
  final _dismissed    = <int>{};
  final _acknowledged = <int>{};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadAdvisories();
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final all = provider.advisories
        .where((a) => !_dismissed.contains(a.id))
        .toList();

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF141A0D),
        elevation: 0,
        title: const Text(
          'Farmer Advisories',
          style: TextStyle(
              color: _txt, fontSize: 16, fontWeight: FontWeight.w600),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: Container(
            color: const Color(0xFF141A0D),
            child: TabBar(
              controller: _tabs,
              indicatorColor: _green2,
              indicatorWeight: 2,
              labelColor: _green2,
              unselectedLabelColor: _txt3,
              labelStyle:
                  const TextStyle(fontSize: 11, fontFamily: 'monospace'),
              tabs: [
                Tab(text: 'ALL (${all.length})'),
                Tab(text: 'URGENT (${all.where((a) => a.isUrgent).length})'),
                Tab(text: 'MEDIUM (${all.where((a) => a.isMedium).length})'),
                Tab(
                    text:
                        'INFO (${all.where((a) => a.urgency == "low").length})'),
              ],
            ),
          ),
        ),
      ),
      body: provider.isLoadingAdvisories
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF7AB648)))
          : TabBarView(
              controller: _tabs,
              children: [
                _AdvisoryList(
                    advisories: all,
                    dismissed: _dismissed,
                    acknowledged: _acknowledged,
                    onDismiss: _dismiss,
                    onAck: _acknowledge),
                _AdvisoryList(
                    advisories:
                        all.where((a) => a.isUrgent).toList(),
                    dismissed: _dismissed,
                    acknowledged: _acknowledged,
                    onDismiss: _dismiss,
                    onAck: _acknowledge),
                _AdvisoryList(
                    advisories:
                        all.where((a) => a.isMedium).toList(),
                    dismissed: _dismissed,
                    acknowledged: _acknowledged,
                    onDismiss: _dismiss,
                    onAck: _acknowledge),
                _AdvisoryList(
                    advisories:
                        all.where((a) => a.urgency == 'low').toList(),
                    dismissed: _dismissed,
                    acknowledged: _acknowledged,
                    onDismiss: _dismiss,
                    onAck: _acknowledge),
              ],
            ),
    );
  }

  void _dismiss(int id) => setState(() => _dismissed.add(id));
  void _acknowledge(int id) => setState(() => _acknowledged.add(id));
}

// ── Advisory List ─────────────────────────────────────────────────────────────

class _AdvisoryList extends StatelessWidget {
  final List<Advisory> advisories;
  final Set<int> dismissed;
  final Set<int> acknowledged;
  final void Function(int) onDismiss;
  final void Function(int) onAck;

  const _AdvisoryList({
    required this.advisories,
    required this.dismissed,
    required this.acknowledged,
    required this.onDismiss,
    required this.onAck,
  });

  @override
  Widget build(BuildContext context) {
    if (advisories.isEmpty) {
      return const Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('✓',
              style: TextStyle(fontSize: 32, color: Color(0xFF4E7A28))),
          SizedBox(height: 8),
          Text('No advisories here',
              style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6A7A58),
                  fontFamily: 'monospace')),
        ]),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(14),
      itemCount: advisories.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) => _AdvisoryCard(
        advisory: advisories[i],
        isAcked: acknowledged.contains(advisories[i].id),
        onDismiss: () => onDismiss(advisories[i].id),
        onAcknowledge: () => onAck(advisories[i].id),
      ),
    );
  }
}

// ── Advisory Card ─────────────────────────────────────────────────────────────

class _AdvisoryCard extends StatelessWidget {
  final Advisory advisory;
  final bool isAcked;
  final VoidCallback onDismiss;
  final VoidCallback onAcknowledge;

  const _AdvisoryCard({
    required this.advisory,
    required this.isAcked,
    required this.onDismiss,
    required this.onAcknowledge,
  });

  static const _urgentBorder = Color(0xFFD45040);
  static const _medBorder    = Color(0xFFD4A843);
  static const _lowBorder    = Color(0xFF3AAA88);

  Color get _borderColor =>
      advisory.isUrgent ? _urgentBorder : advisory.isMedium ? _medBorder : _lowBorder;
  Color get _badgeBg => _borderColor.withOpacity(0.13);
  String get _badgeText =>
      advisory.isUrgent ? 'URGENT' : advisory.isMedium ? 'MEDIUM' : 'INFO';

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: isAcked ? 0.55 : 1.0,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1C2413),
          border: Border(left: BorderSide(color: _borderColor, width: 3)),
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                      color: _badgeBg,
                      borderRadius: BorderRadius.circular(4)),
                  child: Text(_badgeText,
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: _borderColor,
                          fontFamily: 'monospace')),
                ),
                const SizedBox(width: 8),
                if (advisory.district.isNotEmpty)
                  Text(advisory.district,
                      style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF6A7A58),
                          fontFamily: 'monospace')),
                const Spacer(),
                GestureDetector(
                  onTap: onDismiss,
                  child: const Icon(Icons.close,
                      size: 15, color: Color(0xFF6A7A58)),
                ),
              ]),
              const SizedBox(height: 8),

              // Title
              Text(advisory.title,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFE8F0D8))),
              const SizedBox(height: 6),

              // Body
              Text(advisory.body,
                  style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFFA8B898),
                      height: 1.5)),
              const SizedBox(height: 10),

              // Footer
              Row(children: [
                Expanded(
                  child: Text(advisory.meta,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF6A7A58),
                          fontFamily: 'monospace')),
                ),
                const SizedBox(width: 8),
                if (!isAcked)
                  GestureDetector(
                    onTap: onAcknowledge,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7AB648).withOpacity(0.1),
                        border: Border.all(color: const Color(0xFF4E7A28)),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Text('Acknowledge',
                          style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF9FD468),
                              fontFamily: 'monospace')),
                    ),
                  )
                else
                  const Text('✓ Acknowledged',
                      style: TextStyle(
                          fontSize: 10,
                          color: Color(0xFF9FD468),
                          fontFamily: 'monospace')),
              ]),
            ]),
      ),
    );
  }
}