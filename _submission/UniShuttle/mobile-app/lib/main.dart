import 'package:flutter/material.dart';
import 'utils/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/student/student_dashboard.dart';
import 'screens/driver/driver_dashboard.dart';
import 'screens/auth/student_register_screen.dart';
import 'screens/auth/driver_register_screen.dart';
import 'screens/student/student_payments.dart';
import 'screens/driver/driver_payments.dart';
import 'screens/shared/notice_board.dart';
import 'screens/student/student_polls.dart';
import 'screens/driver/driver_polls.dart';
import 'screens/student/student_tracking.dart';
import 'screens/driver/driver_tracking.dart';

void main() {
  runApp(const LankaTripApp());
}

class LankaTripApp extends StatelessWidget {
  const LankaTripApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Uni Shuttle',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
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
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentPaymentsScreen())),
              child: const Text('View Student Payments'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverPaymentsScreen())),
              child: const Text('View Driver Payments'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeBoardScreen(isDriver: false, userName: 'Supun Perera'))),
              child: const Text('View Notice Board (Student)'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeBoardScreen(isDriver: true, userName: 'Chaminda Dias'))),
              child: const Text('View Notice Board (Driver)'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentPollsScreen())),
              child: const Text('View Student Polls'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverPollsScreen())),
              child: const Text('View Driver Polls'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentTrackingScreen())),
              child: const Text('View Student GPS Tracking'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverTrackingScreen())),
              child: const Text('View Driver GPS Tracking'),
            ),
          ],
        ),
      ),
    );
  }
}
