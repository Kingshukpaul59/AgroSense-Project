// mobile/lib/services/api_service.dart
//
// ApiService — thin HTTP wrapper around the AgroSense FastAPI backend.
// All methods return raw Map / List so that AppProvider can parse them
// into typed models without a circular dependency.

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // ── Base URL ───────────────────────────────────────────────────────────────
  // Change to your local IP when testing on a physical device,
  // e.g. 'http://192.168.1.10:8000'
  static const String _base = 'http://10.0.2.2:8000'; // Android emulator
  static const Duration _timeout = Duration(seconds: 15);

  final http.Client _client;
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  // ── Helpers ────────────────────────────────────────────────────────────────
  Uri _uri(String path, [Map<String, String>? params]) =>
      Uri.parse('$_base$path').replace(queryParameters: params);

  Future<dynamic> _get(String path, [Map<String, String>? params]) async {
    final res = await _client
        .get(_uri(path, params))
        .timeout(_timeout);

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw ApiException(res.statusCode, res.body);
  }

  Future<dynamic> _post(String path, Map<String, dynamic> body) async {
    final res = await _client
        .post(
          _uri(path),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(_timeout);

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw ApiException(res.statusCode, res.body);
  }

  // ── Weather ────────────────────────────────────────────────────────────────
  /// GET /weather/forecast?district=Pune
  Future<Map<String, dynamic>> getWeatherForecast(String district) async {
    final data = await _get('/weather/forecast', {'district': district});
    return data as Map<String, dynamic>;
  }

  // ── Mandi Prices ──────────────────────────────────────────────────────────
  /// GET /mandi/prices?commodity=paddy&state=maharashtra
  Future<Map<String, dynamic>> getMandiPrices(
      String commodity, String state) async {
    final data = await _get('/mandi/prices', {
      'commodity': commodity,
      'state':     state,
    });
    return data as Map<String, dynamic>;
  }

  // ── Advisories ─────────────────────────────────────────────────────────────
  /// GET /advisories?district=Pune
  Future<List<dynamic>> getAdvisories({required String district}) async {
    final data = await _get('/advisories', {'district': district});
    return data as List<dynamic>;
  }

  // ── Yield Prediction ───────────────────────────────────────────────────────
  /// POST /yield/predict
  Future<Map<String, dynamic>> predictYield({
    required String crop,
    required String district,
    required String season,
    double areaHa     = 1.0,
    String irrigation = 'Rainfed',
    String soilType   = 'Black cotton',
  }) async {
    final data = await _post('/yield/predict', {
      'crop':       crop,
      'district':   district,
      'season':     season,
      'area_ha':    areaHa,
      'irrigation': irrigation,
      'soil_type':  soilType,
    });
    return data as Map<String, dynamic>;
  }
}

// ── Exception ─────────────────────────────────────────────────────────────────
class ApiException implements Exception {
  final int    statusCode;
  final String body;
  const ApiException(this.statusCode, this.body);

  @override
  String toString() => 'ApiException($statusCode): $body';
}