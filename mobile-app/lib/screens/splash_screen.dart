import 'package:flutter/material.dart';
import '../utils/palette.dart';
import 'auth/login_screen.dart';
import 'auth/driver_pending_screen.dart';
import '../services/api_service.dart';
import 'student/student_dashboard.dart';
import 'driver/driver_dashboard.dart';

import '../utils/lang.dart';
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

    if (token == null || role == null) {
      _goToLogin();
      return;
    }

    // Reject sessions whose token the server no longer accepts (e.g. expired
    // after the 7-day JWT lifetime) instead of showing empty dashboards.
    final isValid = await ApiService.validateToken();
    if (!isValid) {
      await ApiService.logout();
      _goToLogin();
      return;
    }

    if (!mounted) return;

    if (role == 'STUDENT') {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen()));
    } else if (role == 'DRIVER') {
      // A driver still awaiting admin approval must land on the pending
      // screen, same as right after registration. fetchMe refreshes the
      // cached profile so an approval granted while away is picked up.
      final user = await ApiService.fetchMe();
      final status = user?['profile']?['status'];
      if (!mounted) return;
      if (status == 'PENDING') {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverPendingScreen()));
      } else {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverDashboardScreen()));
      }
    } else {
      _goToLogin();
    }
  }

  void _goToLogin() {
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/images/logo_mark.png', height: 100),
            SizedBox(height: 20),
            Text(
              tr('Uni Shuttle'),
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: context.pal.fg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
