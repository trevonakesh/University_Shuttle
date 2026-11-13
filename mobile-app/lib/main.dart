import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

import 'utils/lang.dart';
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeController.load();
  await LangController.load();
  runApp(const LankaTripApp());
}

class LankaTripApp extends StatelessWidget {
  const LankaTripApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: ThemeController.mode,
      builder: (context, mode, _) => MaterialApp(
        title: tr('Uni Shuttle'),
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: mode,
        debugShowCheckedModeBanner: false,
        // Status bar icons follow the mode: dark icons on the light screens.
        builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
          value: Theme.of(context).brightness == Brightness.dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
          child: child!,
        ),
        home: const SplashScreen(),
      ),
    );
  }
}

class TestNavScreen extends StatelessWidget {
  const TestNavScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('UI Sandbox'))),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen())),
              child: Text(tr('View Student Dashboard')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverDashboardScreen())),
              child: Text(tr('View Driver Dashboard')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentRegisterScreen())),
              child: Text(tr('View Student Registration')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverRegisterScreen())),
              child: Text(tr('View Driver Registration')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentPaymentsScreen())),
              child: Text(tr('View Student Payments')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverPaymentsScreen())),
              child: Text(tr('View Driver Payments')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeBoardScreen(isDriver: false, userName: 'Supun Perera'))),
              child: Text(tr('View Notice Board (Student)')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeBoardScreen(isDriver: true, userName: 'Chaminda Dias'))),
              child: Text(tr('View Notice Board (Driver)')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentPollsScreen())),
              child: Text(tr('View Student Polls')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverPollsScreen())),
              child: Text(tr('View Driver Polls')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentTrackingScreen())),
              child: Text(tr('View Student GPS Tracking')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverTrackingScreen())),
              child: Text(tr('View Driver GPS Tracking')),
            ),
          ],
        ),
      ),
    );
  }
}
