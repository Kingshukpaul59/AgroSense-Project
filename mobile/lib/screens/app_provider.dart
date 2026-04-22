// mobile/lib/providers/app_provider.dart
//
// AppProvider — central state management using Provider.
// Holds weather, advisories, mandi data and loading states.
// All screens read from this provider; all API calls go through it.

import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class AppProvider extends ChangeNotifier {
  final ApiService _api;
  AppProvider({ApiService? api}) : _api = api ?? ApiService();

  // ── State ──────────────────────────────────────────────────────────────────
  String _selectedDistrict = 'Pune';
  String _selectedSeason   = 'Kharif 2024';
  String _selectedCrop     = 'Paddy (Rice)';

  WeatherData?     _weatherData;
  MandiSummary?    _mandiSummary;
  List<Advisory>   _advisories      = [];
  YieldPrediction? _yieldPrediction;

  bool    _isLoading           = false;
  bool    _isLoadingAdvisories = false;
  bool    _isLoadingYield      = false;
  String? _error;

  // ── Getters ────────────────────────────────────────────────────────────────
  String           get selectedDistrict    => _selectedDistrict;
  String           get selectedSeason      => _selectedSeason;
  String           get selectedCrop        => _selectedCrop;
  WeatherData?     get weatherData         => _weatherData;
  MandiSummary?    get mandiSummary        => _mandiSummary;
  List<Advisory>   get advisories          => _advisories;
  YieldPrediction? get yieldPrediction     => _yieldPrediction;
  bool             get isLoading           => _isLoading;
  bool             get isLoadingAdvisories => _isLoadingAdvisories;
  bool             get isLoadingYield      => _isLoadingYield;
  String?          get error               => _error;

  List<Advisory> get urgentAdvisories =>
      _advisories.where((a) => a.isUrgent).toList();

  // ── Setters ────────────────────────────────────────────────────────────────
  void setDistrict(String d) {
    _selectedDistrict = d;
    notifyListeners();
    loadHomeData();
  }

  void setSeason(String s) {
    _selectedSeason = s;
    notifyListeners();
  }

  void setCrop(String c) {
    _selectedCrop = c;
    notifyListeners();
  }

  // ── Load Home (weather + mandi, parallel) ─────────────────────────────────
  Future<void> loadHomeData() async {
    _isLoading = true;
    _error     = null;
    notifyListeners();

    try {
      await Future.wait([
        _loadWeatherInternal(),
        _loadMandiInternal(),
      ], eagerError: false);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Weather ────────────────────────────────────────────────────────────────
  Future<void> loadWeather() async {
    _isLoading = true;
    _error     = null;
    notifyListeners();
    try {
      await _loadWeatherInternal();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadWeatherInternal() async {
    final json = await _api.getWeatherForecast(_selectedDistrict);
    _weatherData = WeatherData.fromJson(json);
  }

  // ── Mandi ──────────────────────────────────────────────────────────────────
  Future<void> _loadMandiInternal() async {
    try {
      final json = await _api.getMandiPrices(
        _selectedCrop.toLowerCase().split(' ').first,
        'maharashtra',
      );
      _mandiSummary = MandiSummary.fromJson(json);
    } catch (_) {
      _mandiSummary = null;
    }
  }

  // ── Advisories ─────────────────────────────────────────────────────────────
  Future<void> loadAdvisories() async {
    _isLoadingAdvisories = true;
    notifyListeners();

    try {
      final list = await _api.getAdvisories(district: _selectedDistrict);
      _advisories = list
          .map((j) => Advisory.fromJson(j as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _advisories = _mockAdvisories;
    } finally {
      _isLoadingAdvisories = false;
      notifyListeners();
    }
  }

  // ── Yield Prediction ───────────────────────────────────────────────────────
  Future<YieldPrediction?> predictYield({
    required String crop,
    required String district,
    required String season,
    double areaHa     = 1.0,
    String irrigation = 'Rainfed',
    String soilType   = 'Black cotton',
  }) async {
    _isLoadingYield  = true;
    _yieldPrediction = null;
    notifyListeners();

    try {
      final json = await _api.predictYield(
        crop:       crop,
        district:   district,
        season:     season,
        areaHa:     areaHa,
        irrigation: irrigation,
        soilType:   soilType,
      );
      _yieldPrediction = YieldPrediction.fromJson(json);
      return _yieldPrediction;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoadingYield = false;
      notifyListeners();
    }
  }

  // ── Mock fallback advisories ───────────────────────────────────────────────
  static final List<Advisory> _mockAdvisories = [
    const Advisory(
        id: 1, urgency: 'urgent', district: 'Nashik',
        title: 'Brown planthopper outbreak',
        body: 'Population above economic threshold. Apply imidacloprid 17.8 SL at 0.3 ml/L immediately.',
        meta: 'Crop: Paddy · Severity: High'),
    const Advisory(
        id: 2, urgency: 'urgent', district: 'Latur',
        title: 'Moisture deficit stress',
        body: 'Soil moisture below 25%. Immediate irrigation required for wheat crop.',
        meta: 'Crop: Wheat · Severity: Critical'),
    const Advisory(
        id: 3, urgency: 'medium', district: 'Satara',
        title: 'Nitrogen top-dress window',
        body: 'Optimal window for split N application. Apply 40 kg urea/ha in next 6–10 days.',
        meta: 'Crop: Paddy · 8,400 ha'),
    const Advisory(
        id: 4, urgency: 'medium', district: 'Nashik',
        title: 'Powdery mildew risk',
        body: 'Begin preventive sulfur dust application on alternate rows.',
        meta: 'Crop: Grapes · Risk window: 14 days'),
    const Advisory(
        id: 5, urgency: 'low', district: 'Kolhapur',
        title: 'New seed variety trial',
        body: 'ICAR-released PEHM-2 shows 22% yield advantage. Enrol in district demonstration trial.',
        meta: 'Research · Open enrolment'),
  ];
}