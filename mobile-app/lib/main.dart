import 'package:flutter/material.dart';
import 'utils/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/student/student_dashboard.dart';
import 'screens/driver/driver_dashboard.dart';
import 'screens/auth/student_register_screen.dart';
import 'screens/auth/driver_register_screen.dart';

void main() {
  runApp(const LankaTripApp());
}

class LankaTripApp extends StatelessWidget {
  const LankaTripApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LankaTrip UI Test',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const TestNavScreen(),
    );
  }
}

class TestNavScreen extends StatelessWidget {
  const TestNavScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('UI Sandbox')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen())),
              child: const Text('View Student Dashboard'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverDashboardScreen())),
              child: const Text('View Driver Dashboard'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentRegisterScreen())),
              child: const Text('View Student Registration'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverRegisterScreen())),
              child: const Text('View Driver Registration'),
            ),
          ],
        ),
      ),
    );
  }
}
