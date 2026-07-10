// mobile/lib/screens/home_screen.dart
//
// HomeScreen — today's key metrics: weather, yield, mandi price, advisory count.
// First screen shown after app launch.

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../models/models.dart';
import '../widgets/metric_card.dart';
import '../widgets/advisory_chip.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _bg     = Color(0xFF0D1208);
  static const _surface = Color(0xFF1F2A14);
  static const _border  = Color(0xFF2E3D1E);
  static const _green   = Color(0xFF7AB648);
  static const _green2  = Color(0xFF9FD468);
  static const _amber   = Color(0xFFD4A843);
  static const _txt     = Color(0xFFE8F0D8);
  static const _txt2    = Color(0xFFA8B898);
  static const _txt3    = Color(0xFF6A7A58);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadHomeData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return Scaffold(
      backgroundColor: _bg,
      bottomNavigationBar: _BottomNav(currentIndex: 0),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App Bar ────────────────────────────────────────────────────
            SliverAppBar(
              backgroundColor: _bg,
              expandedHeight: 120,
              pinned: true,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  color: _bg,
                  padding: const EdgeInsets.fromLTRB(20, 60, 20, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: const Color(0xFF4E7A28),
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: const Center(
                            child: Text('🌿',
                                style: TextStyle(fontSize: 18))),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('AgroIntel',
                              style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: _txt)),
                          Text(provider.selectedDistrict,
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: _txt3,
                                  fontFamily: 'monospace')),
                        ],
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () =>
                            _showDistrictPicker(context, provider),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: _surface,
                            border: Border.all(color: _border),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(children: [
                            const Icon(Icons.location_on_outlined,
                                size: 13, color: _txt3),
                            const SizedBox(width: 4),
                            Text(provider.selectedDistrict,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: _txt2,
                                    fontFamily: 'monospace')),
                            const SizedBox(width: 4),
                            const Icon(Icons.expand_more,
                                size: 13, color: _txt3),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Content ────────────────────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _SeasonBadge(season: provider.selectedSeason),
                  const SizedBox(height: 16),

                  // ── Today's Weather Card ───────────────────────────────
                  if (provider.isLoading)
                    const _ShimmerCard(height: 110)
                  else if (provider.weatherData != null)
                    _WeatherSummaryCard(weather: provider.weatherData!)
                  else
                    _ErrorCard(
                        message: 'Weather unavailable',
                        onRetry: provider.loadHomeData),
                  const SizedBox(height: 12),

                  // ── KPI Grid ───────────────────────────────────────────
                  const _SectionTitle(title: 'KEY METRICS'),
                  const SizedBox(height: 8),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.65,
                    children: [
                      MetricCard(
                        label: 'Avg Yield',
                        value: '3.8',
                        unit: 't/ha',
                        delta: '▲ 12.4%',
                        deltaUp: true,
                        fillPct: 0.72,
                        fillColor: _green,
                      ),
                      MetricCard(
                        label: 'Demand Coverage',
                        value: '87',
                        unit: '%',
                        delta: '▼ 3.1%',
                        deltaUp: false,
                        fillPct: 0.87,
                        fillColor: _amber,
                      ),
                      MetricCard(
                        label: 'Mandi Price',
                        value: provider.mandiSummary != null
                            ? '₹${provider.mandiSummary!.avgModal.toStringAsFixed(0)}'
                            : '—',
                        unit: '/q',
                        delta: provider.mandiSummary?.vsMspLabel ?? '',
                        deltaUp:
                            (provider.mandiSummary?.vsMspPct ?? 0) >= 0,
                        fillPct: 0.68,
                        fillColor: const Color(0xFF4A90C4),
                      ),
                      MetricCard(
                        label: 'Active Alerts',
                        value: '${provider.advisories.length}',
                        unit: '',
                        delta:
                            '${provider.urgentAdvisories.length} urgent',
                        deltaUp: false,
                        fillPct: 0.60,
                        fillColor: _amber,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Advisory Chips ─────────────────────────────────────
                  const _SectionTitle(title: 'URGENT ADVISORIES'),
                  const SizedBox(height: 8),
                  if (provider.urgentAdvisories.isNotEmpty)
                    ...provider.urgentAdvisories.take(3).map((a) =>
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: AdvisoryChip(advisory: a),
                        ))
                  else
                    const _EmptyState(
                        message: 'No urgent advisories today'),
                  const SizedBox(height: 8),

                  // View all advisories button
                  OutlinedButton(
                    onPressed: () =>
                        Navigator.pushNamed(context, '/advisory'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _green2,
                      side: const BorderSide(color: Color(0xFF3D5228)),
                      backgroundColor: const Color(0xFF1F2A14),
                      padding:
                          const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: const Text('View All Advisories',
                        style: TextStyle(
                            fontSize: 12, fontFamily: 'monospace')),
                  ),
                  const SizedBox(height: 24),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDistrictPicker(
      BuildContext context, AppProvider provider) {
    const districts = [
      'Pune', 'Nashik', 'Aurangabad', 'Nagpur', 'Latur',
      'Satara', 'Kolhapur', 'Solapur', 'Ahmednagar', 'Amravati'
    ];
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1F2A14),
      shape: const RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Select District',
                style: TextStyle(
                    color: Color(0xFFE8F0D8),
                    fontWeight: FontWeight.w600)),
          ),
          ...districts.map((d) => ListTile(
                title: Text(d,
                    style: const TextStyle(
                        color: Color(0xFFA8B898), fontSize: 14)),
                trailing: provider.selectedDistrict == d
                    ? const Icon(Icons.check,
                        color: Color(0xFF9FD468), size: 16)
                    : null,
                onTap: () {
                  provider.setDistrict(d);
                  Navigator.pop(ctx);
                },
              )),
        ],
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _WeatherSummaryCard extends StatelessWidget {
  final WeatherData weather;
  const _WeatherSummaryCard({required this.weather});

  @override
  Widget build(BuildContext context) {
    final today = weather.today;
    if (today == null) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2A14),
        border: Border.all(color: const Color(0xFF2E3D1E)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Text(today.icon, style: const TextStyle(fontSize: 40)),
        const SizedBox(width: 16),
        Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              Text('${today.highC.toInt()}° / ${today.lowC.toInt()}°',
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFE8F0D8))),
              Text(today.condition,
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFFA8B898))),
              const SizedBox(height: 4),
              Text(
                  'Rain: ${today.rainMm}mm  ·  Wind: ${today.windKph.toInt()} km/h',
                  style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6A7A58),
                      fontFamily: 'monospace')),
            ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          _IndexPill(
              label: 'Soil',
              value: '${weather.indices.soilMoisturePct.toInt()}%',
              color: const Color(0xFF7AB648)),
          const SizedBox(height: 4),
          _IndexPill(
              label: 'Pest',
              value: '${weather.indices.pestRiskIndex}',
              color: weather.indices.pestRiskIndex > 60
                  ? const Color(0xFFD45040)
                  : const Color(0xFFD4A843)),
        ]),
      ]),
    );
  }
}

class _IndexPill extends StatelessWidget {
  final String label, value;
  final Color color;
  const _IndexPill(
      {required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Text('$label $value',
            style: TextStyle(
                fontSize: 10,
                color: color,
                fontFamily: 'monospace')),
      );
}

class _SeasonBadge extends StatelessWidget {
  final String season;
  const _SeasonBadge({required this.season});

  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFF1F2A14),
            border: Border.all(color: const Color(0xFF3D5228)),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(season,
              style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFFF0C85A),
                  fontFamily: 'monospace')),
        ),
        const SizedBox(width: 8),
        Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
                color: Color(0xFF7AB648), shape: BoxShape.circle)),
        const SizedBox(width: 4),
        const Text('Live',
            style: TextStyle(
                fontSize: 11,
                color: Color(0xFF6A7A58),
                fontFamily: 'monospace')),
      ]);
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(
          fontSize: 10,
          color: Color(0xFF6A7A58),
          fontFamily: 'monospace',
          letterSpacing: 0.8));
}

class _ShimmerCard extends StatelessWidget {
  final double height;
  const _ShimmerCard({required this.height});

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFF1F2A14),
          borderRadius: BorderRadius.circular(12),
        ),
      );
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorCard(
      {required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2A14),
          border: Border.all(
              color: const Color(0xFFD45040).withOpacity(0.4)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          const Icon(Icons.error_outline,
              color: Color(0xFFD45040), size: 18),
          const SizedBox(width: 10),
          Expanded(
              child: Text(message,
                  style: const TextStyle(
                      color: Color(0xFFA8B898), fontSize: 13))),
          TextButton(
              onPressed: onRetry,
              child: const Text('Retry',
                  style: TextStyle(
                      color: Color(0xFF9FD468), fontSize: 12))),
        ]),
      );
}

class _EmptyState extends StatelessWidget {
  final String message;
  const _EmptyState({required this.message});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2A14),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(message,
            style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6A7A58),
                fontFamily: 'monospace')),
      );
}

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  const _BottomNav({required this.currentIndex});

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF141A0D),
          border:
              Border(top: BorderSide(color: Color(0xFF2E3D1E))),
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: const Color(0xFF9FD468),
          unselectedItemColor: const Color(0xFF6A7A58),
          selectedFontSize: 10,
          unselectedFontSize: 10,
          type: BottomNavigationBarType.fixed,
          onTap: (i) {
            const routes = [
              '/',
              '/advisory',
              '/weather',
              '/yield',
              '/market'
            ];
            if (i < routes.length) {
              Navigator.pushNamed(context, routes[i]);
            }
          },
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_outlined, size: 22),
                label: 'Home'),
            BottomNavigationBarItem(
                icon: Icon(Icons.chat_bubble_outline, size: 22),
                label: 'Advisory'),
            BottomNavigationBarItem(
                icon: Icon(Icons.wb_sunny_outlined, size: 22),
                label: 'Weather'),
            BottomNavigationBarItem(
                icon: Icon(Icons.bar_chart, size: 22),
                label: 'Yield'),
            BottomNavigationBarItem(
                icon: Icon(Icons.storefront_outlined, size: 22),
                label: 'Market'),
          ],
        ),
      );
}