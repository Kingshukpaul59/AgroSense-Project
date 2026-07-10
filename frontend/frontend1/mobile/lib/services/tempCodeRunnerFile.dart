// mobile/lib/models/models.dart
//
// Dart data models — mirror the FastAPI Pydantic schemas exactly.

// ── Weather ─────────────────────────────────────────────────────────────────

class DayForecast {
  final String date;
  final String day;
  final String icon;
  final String condition;
  final double highC;
  final double lowC;
  final double rainMm;
  final double humidityPct;
  final double windKph;
  final double et0Mm;

  const DayForecast({
    required this.date,
    required this.day,
    required this.icon,
    required this.condition,
    required this.highC,
    required this.lowC,
    required this.rainMm,
    required this.humidityPct,
    required this.windKph,
    required this.et0Mm,
  });

  factory DayForecast.fromJson(Map<String, dynamic> j) => DayForecast(
    date:        j['date']         as String,
    day:         j['day']          as String,
    icon:        j['icon']         as String,
    condition:   j['condition']    as String,
    highC:       (j['high_c']      as num).toDouble(),
    lowC:        (j['low_c']       as num).toDouble(),
    rainMm:      (j['rain_mm']     as num).toDouble(),
    humidityPct: (j['humidity_pct']as num).toDouble(),
    windKph:     (j['wind_kph']    as num).toDouble(),
    et0Mm:       (j['et0_mm']      as num).toDouble(),
  );
}

class AgroIndices {
  final double evapotranspiration;
  final double soilMoisturePct;
  final double gddAccumulated;
  final int    pestRiskIndex;

  const AgroIndices({
    required this.evapotranspiration,
    required this.soilMoisturePct,
    required this.gddAccumulated,
    required this.pestRiskIndex,
  });

  factory AgroIndices.fromJson(Map<String, dynamic> j) => AgroIndices(
    evapotranspiration: (j['evapotranspiration'] as num).toDouble(),
    soilMoisturePct:    (j['soil_moisture_pct']  as num).toDouble(),
    gddAccumulated:     (j['gdd_accumulated']     as num).toDouble(),
    pestRiskIndex:      j['pest_risk_index']      as int,
  );

  String get pestRiskLabel {
    if (pestRiskIndex >= 70) return 'High';
    if (pestRiskIndex >= 40) return 'Moderate';
    return 'Low';
  }
}

class WeatherData {
  final String          district;
  final double          latitude;
  final double          longitude;
  final List<DayForecast> forecast;
  final AgroIndices     indices;
  final String          fetchedAt;

  const WeatherData({
    required this.district,
    required this.latitude,
    required this.longitude,
    required this.forecast,
    required this.indices,
    required this.fetchedAt,
  });

  factory WeatherData.fromJson(Map<String, dynamic> j) => WeatherData(
    district:  j['district']  as String,
    latitude:  (j['latitude'] as num).toDouble(),
    longitude: (j['longitude']as num).toDouble(),
    forecast:  (j['forecast'] as List).map((e) => DayForecast.fromJson(e)).toList(),
    indices:   AgroIndices.fromJson(j['indices']),
    fetchedAt: j['fetched_at']as String,
  );

  DayForecast? get today => forecast.isNotEmpty ? forecast.first : null;
}

// ── Yield ────────────────────────────────────────────────────────────────────

class YieldPrediction {
  final double predictedYield;
  final double confidenceLow;
  final double confidenceHigh;
  final int    confidencePct;
  final String riskLevel;
  final Map<String, double> featureImportance;

  const YieldPrediction({
    required this.predictedYield,
    required this.confidenceLow,
    required this.confidenceHigh,
    required this.confidencePct,
    required this.riskLevel,
    required this.featureImportance,
  });

  factory YieldPrediction.fromJson(Map<String, dynamic> j) => YieldPrediction(
    predictedYield:    (j['predicted_yield']  as num).toDouble(),
    confidenceLow:     (j['confidence_low']   as num).toDouble(),
    confidenceHigh:    (j['confidence_high']  as num).toDouble(),
    confidencePct:     j['confidence_pct']    as int,
    riskLevel:         j['risk_level']        as String,
    featureImportance: Map<String, double>.from(
      (j['feature_importance'] as Map).map((k, v) => MapEntry(k.toString(), (v as num).toDouble()))
    ),
  );

  String get riskEmoji {
    switch (riskLevel) {
      case 'high':     return '🔴';
      case 'moderate': return '🟡';
      default:         return '🟢';
    }
  }
}

// ── Mandi ────────────────────────────────────────────────────────────────────

class MandiRecord {
  final String state;
  final String district;
  final String market;
  final String commodity;
  final double minPrice;
  final double maxPrice;
  final double modalPrice;

  const MandiRecord({
    required this.state,
    required this.district,
    required this.market,
    required this.commodity,
    required this.minPrice,
    required this.maxPrice,
    required this.modalPrice,
  });

  factory MandiRecord.fromJson(Map<String, dynamic> j) => MandiRecord(
    state:      j['state']       as String,
    district:   j['district']    as String,
    market:     j['market']      as String,
    commodity:  j['commodity']   as String,
    minPrice:   (j['min_price']  as num).toDouble(),
    maxPrice:   (j['max_price']  as num).toDouble(),
    modalPrice: (j['modal_price']as num).toDouble(),
  );
}

class MandiSummary {
  final String         commodity;
  final String         state;
  final String         date;
  final List<MandiRecord> records;
  final double         avgModal;
  final double?        msp2024;
  final double?        vsMspPct;

  const MandiSummary({
    required this.commodity,
    required this.state,
    required this.date,
    required this.records,
    required this.avgModal,
    this.msp2024,
    this.vsMspPct,
  });

  factory MandiSummary.fromJson(Map<String, dynamic> j) => MandiSummary(
    commodity: j['commodity'] as String,
    state:     j['state']     as String,
    date:      j['date']      as String,
    records:   (j['records']  as List).map((e) => MandiRecord.fromJson(e)).toList(),
    avgModal:  (j['avg_modal']as num).toDouble(),
    msp2024:   j['msp_2024']  != null ? (j['msp_2024'] as num).toDouble() : null,
    vsMspPct:  j['vs_msp_pct']!= null ? (j['vs_msp_pct'] as num).toDouble(): null,
  );

  String get vsMspLabel {
    if (vsMspPct == null) return 'MSP n/a';
    final sign = vsMspPct! >= 0 ? '+' : '';
    return '$sign${vsMspPct!.toStringAsFixed(1)}% vs MSP';
  }
}

// ── Advisory ─────────────────────────────────────────────────────────────────

class Advisory {
  final int    id;
  final String urgency;
  final String district;
  final String title;
  final String body;
  final String meta;

  const Advisory({
    required this.id,
    required this.urgency,
    required this.district,
    required this.title,
    required this.body,
    required this.meta,
  });

  factory Advisory.fromJson(Map<String, dynamic> j) => Advisory(
    id:       j['id']       as int,
    urgency:  j['urgency']  as String,
    district: j['district'] as String? ?? '',
    title:    j['title']    as String,
    body:     j['body']     as String,
    meta:     j['meta']     as String? ?? '',
  );

  bool get isUrgent  => urgency == 'urgent';
  bool get isMedium  => urgency == 'medium';
}