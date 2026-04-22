// mobile/lib/screens/weather_screen.dart
//
// WeatherScreen — 7-day forecast cards + agro-met indices + rain alerts.

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../models/models.dart';

class WeatherScreen extends StatefulWidget {
  const WeatherScreen({super.key});
  @override
  State<WeatherScreen> createState() => _WeatherScreenState();
}

class _WeatherScreenState extends State<WeatherScreen> {
  static const _bg     = Color(0xFF0D1208);
  static const _surface = Color(0xFF1F2A14);
  static const _border  = Color(0xFF2E3D1E);
  static const _txt     = Color(0xFFE8F0D8);
  static const _txt3    = Color(0xFF6A7A58);
  static const _green   = Color(0xFF7AB648);
  static const _green2  = Color(0xFF9FD468);
  static const _amber2  = Color(0xFFF0C85A);
  static const _red2    = Color(0xFFF07060);
  static const _blue2   = Color(0xFF6AB4E8);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadWeather();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final weather  = provider.weatherData;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF141A0D),
        elevation: 0,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Weather Station',
              style: TextStyle(
                  color: _txt, fontSize: 16, fontWeight: FontWeight.w600)),
          Text(provider.selectedDistrict,
              style: const TextStyle(
                  color: _txt3, fontSize: 11, fontFamily: 'monospace')),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: _txt3, size: 20),
            onPressed: provider.loadWeather,
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: _green))
          : weather == null
              ? _buildError(provider)
              : _buildContent(weather),
    );
  }

  Widget _buildError(AppProvider provider) => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.cloud_off, color: Color(0xFF6A7A58), size: 40),
          const SizedBox(height: 12),
          const Text('Weather data unavailable',
              style: TextStyle(color: Color(0xFFA8B898), fontSize: 14)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: provider.loadWeather,
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4E7A28)),
            child: const Text('Retry'),
          ),
        ]),
      );

  Widget _buildContent(WeatherData weather) {
    final rainDays = weather.forecast.where((d) => d.rainMm >= 10).toList();

    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        // ── Rain Alert Banner ──────────────────────────────────────────────
        if (rainDays.isNotEmpty) ...[
          _RainAlertBanner(days: rainDays),
          const SizedBox(height: 12),
        ],

        // ── 7-day strip ────────────────────────────────────────────────────
        const _SectionLabel(label: '7-DAY FORECAST'),
        const SizedBox(height: 8),
        SizedBox(
          height: 140,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: weather.forecast.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, i) =>
                _DayCard(day: weather.forecast[i], isToday: i == 0),
          ),
        ),
        const SizedBox(height: 18),

        // ── Agro-met Indices ───────────────────────────────────────────────
        const _SectionLabel(label: 'AGRO-METEOROLOGICAL INDICES'),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.5,
          children: [
            _IndexCard(
              label: 'EVAPOTRANSPIRATION',
              value: '${weather.indices.evapotranspiration}',
              unit: 'mm/day',
              fill: weather.indices.evapotranspiration / 10,
              color: _amber2,
              note: weather.indices.evapotranspiration > 4
                  ? 'Irrigate fields'
                  : 'Normal',
            ),
            _IndexCard(
              label: 'SOIL MOISTURE',
              value: '${weather.indices.soilMoisturePct.toInt()}',
              unit: '%',
              fill: weather.indices.soilMoisturePct / 100,
              color: _green2,
              note: weather.indices.soilMoisturePct > 25
                  ? 'Adequate'
                  : 'Low — water needed',
            ),
            _IndexCard(
              label: 'GDD ACCUMULATED',
              value: '${weather.indices.gddAccumulated.toInt()}',
              unit: '°C·d',
              fill: weather.indices.gddAccumulated / 2000,
              color: _blue2,
              note: 'Growing degree days',
            ),
            _IndexCard(
              label: 'PEST RISK INDEX',
              value: '${weather.indices.pestRiskIndex}',
              unit: '/100',
              fill: weather.indices.pestRiskIndex / 100,
              color: weather.indices.pestRiskIndex > 60 ? _red2 : _amber2,
              note: weather.indices.pestRiskLabel,
            ),
          ],
        ),
        const SizedBox(height: 18),

        // ── Wind & Humidity table ──────────────────────────────────────────
        const _SectionLabel(label: 'WIND & HUMIDITY'),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: _surface,
            border: Border.all(color: _border),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: weather.forecast.asMap().entries.map((e) {
              final i = e.key;
              final d = e.value;
              return Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  border: i < weather.forecast.length - 1
                      ? const Border(
                          bottom:
                              BorderSide(color: _border, width: 0.5))
                      : null,
                ),
                child: Row(children: [
                  SizedBox(
                      width: 36,
                      child: Text(i == 0 ? 'Today' : d.day,
                          style: const TextStyle(
                              fontSize: 11,
                              color: _txt3,
                              fontFamily: 'monospace'))),
                  const SizedBox(width: 8),
                  Text(d.icon, style: const TextStyle(fontSize: 16)),
                  const Spacer(),
                  Text('${d.windKph.toInt()} km/h',
                      style: const TextStyle(
                          fontSize: 12,
                          color: _blue2,
                          fontFamily: 'monospace')),
                  const SizedBox(width: 16),
                  Text('${d.humidityPct.toInt()}% RH',
                      style: const TextStyle(
                          fontSize: 12,
                          color: _txt3,
                          fontFamily: 'monospace')),
                ]),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _RainAlertBanner extends StatelessWidget {
  final List<DayForecast> days;
  const _RainAlertBanner({required this.days});

  @override
  Widget build(BuildContext context) {
    final maxRain =
        days.map((d) => d.rainMm).reduce((a, b) => a > b ? a : b);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF4A90C4).withOpacity(0.1),
        border: Border.all(
            color: const Color(0xFF4A90C4).withOpacity(0.4)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(children: [
        const Text('🌧', style: TextStyle(fontSize: 20)),
        const SizedBox(width: 10),
        Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              const Text('Rain Alert',
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF6AB4E8))),
              Text(
                  '${days.length} day(s) with heavy rain (up to ${maxRain}mm). Consider delaying harvest or irrigation.',
                  style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFFA8B898),
                      height: 1.4)),
            ])),
      ]),
    );
  }
}

class _DayCard extends StatelessWidget {
  final DayForecast day;
  final bool isToday;
  const _DayCard({required this.day, this.isToday = false});

  @override
  Widget build(BuildContext context) {
    final rainColor = day.rainMm >= 20
        ? const Color(0xFFF07060)
        : day.rainMm >= 5
            ? const Color(0xFF6AB4E8)
            : const Color(0xFF6A7A58);

    return Container(
      width: 72,
      decoration: BoxDecoration(
        color: isToday
            ? const Color(0xFF283318)
            : const Color(0xFF1C2413),
        border: Border.all(
            color: isToday
                ? const Color(0xFF4E7A28)
                : const Color(0xFF2E3D1E)),
        borderRadius: BorderRadius.circular(10),
      ),
      padding:
          const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
                isToday ? 'TODAY' : day.day.toUpperCase(),
                style: TextStyle(
                    fontSize: 9,
                    color: isToday
                        ? const Color(0xFF9FD468)
                        : const Color(0xFF6A7A58),
                    fontFamily: 'monospace',
                    letterSpacing: 0.5)),
            Text(day.icon, style: const TextStyle(fontSize: 26)),
            Text('${day.highC.toInt()}°',
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFFE8F0D8))),
            Text('${day.lowC.toInt()}°',
                style: const TextStyle(
                    fontSize: 12, color: Color(0xFF6A7A58))),
            Text(day.rainMm > 0 ? '${day.rainMm}mm' : 'Dry',
                style: TextStyle(
                    fontSize: 10,
                    color: rainColor,
                    fontFamily: 'monospace')),
          ]),
    );
  }
}

class _IndexCard extends StatelessWidget {
  final String label, value, unit, note;
  final double fill;
  final Color color;
  const _IndexCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.fill,
    required this.color,
    required this.note,
  });

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1C2413),
          border: Border.all(color: const Color(0xFF2E3D1E)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                      fontSize: 9,
                      color: Color(0xFF6A7A58),
                      fontFamily: 'monospace',
                      letterSpacing: 0.5)),
              const SizedBox(height: 6),
              Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(value,
                        style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFFE8F0D8))),
                    const SizedBox(width: 3),
                    Text(unit,
                        style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6A7A58),
                            fontFamily: 'monospace')),
                  ]),
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: fill.clamp(0.0, 1.0),
                backgroundColor: const Color(0xFF2E3D1E),
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 4,
                borderRadius: BorderRadius.circular(2),
              ),
              const SizedBox(height: 6),
              Text(note,
                  style: TextStyle(
                      fontSize: 10,
                      color: color,
                      fontFamily: 'monospace')),
            ]),
      );
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});
  @override
  Widget build(BuildContext context) => Text(label,
      style: const TextStyle(
          fontSize: 10,
          color: Color(0xFF6A7A58),
          fontFamily: 'monospace',
          letterSpacing: 0.8));
}