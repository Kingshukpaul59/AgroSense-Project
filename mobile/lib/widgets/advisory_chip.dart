// mobile/lib/widgets/advisory_chip.dart

import 'package:flutter/material.dart';
import '../models/models.dart';

class AdvisoryChip extends StatelessWidget {
  final Advisory advisory;
  const AdvisoryChip({super.key, required this.advisory});

  static const _urgentColor = Color(0xFFD45040);
  static const _medColor    = Color(0xFFD4A843);
  static const _lowColor    = Color(0xFF3AAA88);

  Color get _color =>
      advisory.isUrgent ? _urgentColor : advisory.isMedium ? _medColor : _lowColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2413),
        border: Border(left: BorderSide(color: _color, width: 3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                advisory.title,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFFE8F0D8),
                ),
              ),
              const SizedBox(height: 3),
              Text(
                advisory.body,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFFA8B898),
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
          decoration: BoxDecoration(
            color: _color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            advisory.isUrgent ? 'URGENT' : advisory.isMedium ? 'MED' : 'INFO',
            style: TextStyle(
              fontSize: 9,
              color: _color,
              fontFamily: 'monospace',
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ]),
    );
  }
}