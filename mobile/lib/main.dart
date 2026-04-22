// mobile/lib/main.dart
//
// AgroSense Flutter app entry point.
// Wires up Provider state management and named route navigation.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'providers/app_provider.dart';
import 'screens/home_screen.dart';
import 'screens/advisory_screen.dart';
import 'screens/weather_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait — most agricultural apps don't need landscape
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar style — match dark app background
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor:            Colors.transparent,
    statusBarIconBrightness:   Brightness.light,
    systemNavigationBarColor:  Color(0xFF141A0D),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child:  const AgroSenseApp(),
    ),
  );
}

class AgroSenseApp extends StatelessWidget {
  const AgroSenseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title:          'AgroIntel',
      debugShowCheckedModeBanner: false,
      theme:          _buildTheme(),
      initialRoute:   '/',
      routes: {
        '/':          (_) => const HomeScreen(),
        '/advisory':  (_) => const AdvisoryScreen(),
        '/weather':   (_) => const WeatherScreen(),
        // Add yield, market, soil screens as they are built
      },
      // Fallback for unknown routes
      onUnknownRoute: (_) => MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  ThemeData _buildTheme() {
    return ThemeData(
      useMaterial3:       true,
      brightness:         Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0D1208),
      colorScheme: const ColorScheme.dark(
        primary:           Color(0xFF7AB648),
        onPrimary:         Color(0xFF0D1208),
        secondary:         Color(0xFFD4A843),
        surface:           Color(0xFF1F2A14),
        onSurface:         Color(0xFFE8F0D8),
        error:             Color(0xFFD45040),
      ),
      fontFamily: 'Outfit',
      textTheme: const TextTheme(
        bodyLarge:   TextStyle(color: Color(0xFFE8F0D8), fontSize: 14),
        bodyMedium:  TextStyle(color: Color(0xFFA8B898), fontSize: 13),
        bodySmall:   TextStyle(color: Color(0xFF6A7A58), fontSize: 11),
        titleMedium: TextStyle(color: Color(0xFFE8F0D8), fontSize: 16, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor:  Color(0xFF141A0D),
        elevation:        0,
        iconTheme:        IconThemeData(color: Color(0xFFA8B898)),
        titleTextStyle:   TextStyle(color: Color(0xFFE8F0D8), fontSize: 16, fontWeight: FontWeight.w600, fontFamily: 'Outfit'),
      ),
      tabBarTheme: const TabBarThemeData(
        indicatorColor: Color(0xFF9FD468),
        labelColor: Color(0xFF9FD468),
        unselectedLabelColor: Color(0xFF6A7A58),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: Color(0xFF7AB648),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled:           true,
        fillColor:        Color(0xFF1C2413),
        border: OutlineInputBorder(
          borderSide: BorderSide(color: Color(0xFF3D5228)),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Color(0xFF3D5228)),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Color(0xFF7AB648)),
        ),
        labelStyle: TextStyle(color: Color(0xFF6A7A58)),
        hintStyle:  TextStyle(color: Color(0xFF6A7A58)),
      ),
    );
  }
}