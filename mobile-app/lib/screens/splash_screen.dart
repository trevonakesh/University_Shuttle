import 'package:flutter/material.dart';
import 'auth/login_screen.dart';
import '../services/api_service.dart';
import 'student/student_dashboard.dart';
import 'driver/driver_dashboard.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    // Artificial delay for splash screen branding
    await Future.delayed(const Duration(seconds: 2));
    
    final token = await ApiService.getToken();
    final role = await ApiService.getRole();

    if (!mounted) return;

    if (token != null && role != null) {
      if (role == 'STUDENT') {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen()));
      } else if (role == 'DRIVER') {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverDashboardScreen()));
      } else {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      }
    } else {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.directions_bus, size: 100, color: Colors.white),
            SizedBox(height: 20),
            Text(
              'LankaTrip',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
