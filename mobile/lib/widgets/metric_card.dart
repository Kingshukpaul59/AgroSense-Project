// mobile/lib/widgets/metric_card.dart

import 'package:flutter/material.dart';

class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final String delta;
  final bool   deltaUp;
  final double fillPct;
  final Color  fillColor;

  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.unit,
    required this.delta,
    required this.deltaUp,
    required this.fillPct,
    required this.fillColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2413),
        border: Border.all(color: const Color(0xFF2E3D1E)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 9,
              color: Color(0xFF6A7A58),
              fontFamily: 'monospace',
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFE8F0D8),
                ),
              ),
              if (unit.isNotEmpty) ...[
                const SizedBox(width: 3),
                Text(
                  unit,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF6A7A58),
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ],
          ),
          const Spacer(),
          LinearProgressIndicator(
            value: fillPct.clamp(0.0, 1.0),
            backgroundColor: const Color(0xFF2E3D1E),
            valueColor: AlwaysStoppedAnimation<Color>(fillColor),
            minHeight: 3,
            borderRadius: BorderRadius.circular(2),
          ),
          const SizedBox(height: 5),
          Text(
            delta,
            style: TextStyle(
              fontSize: 10,
              color: deltaUp
                  ? const Color(0xFF9FD468)
                  : const Color(0xFFF07060),
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }
}