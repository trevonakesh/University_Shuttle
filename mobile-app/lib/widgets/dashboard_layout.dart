import 'dart:ui';
import 'package:flutter/material.dart';
import '../screens/auth/login_screen.dart';
import '../services/api_service.dart';
import '../screens/student/student_dashboard.dart';
import '../screens/driver/driver_dashboard.dart';
import '../screens/student/student_payments.dart';
import '../screens/driver/driver_payments.dart';
import '../screens/shared/notice_board.dart';
import '../screens/student/student_polls.dart';
import '../screens/driver/driver_polls.dart';
import '../screens/student/student_tracking.dart';
import '../screens/student/student_profile.dart';
import '../screens/student/student_my_bus.dart';
import '../screens/student/student_available_buses.dart';
import '../screens/driver/driver_tracking.dart';
import '../screens/driver/driver_passengers.dart';
import '../screens/driver/driver_profile.dart';
import '../screens/shared/info_screens.dart';

class DashboardLayout extends StatelessWidget {
  final Widget child;
  final String userName;
  final String userRole;
  final int activeIndex;

  const DashboardLayout({
    Key? key,
    required this.child,
    required this.userName,
    required this.userRole,
    this.activeIndex = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background Image with dark overlay
          Image.network(
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=3538&auto=format&fit=crop',
            fit: BoxFit.cover,
          ),
          Container(
            color: Colors.black.withOpacity(0.75),
          ),
          
          // Main Layout
          Row(
            children: [
              // Sidebar (Fixed Width)
              SizedBox(
                width: 250,
                child: _buildSidebar(context),
              ),
              
              // Main Content Area
              Expanded(
                child: Column(
                  children: [
                    // Top Header
                    _buildHeader(context),
                    
                    // Dynamic Content (Student or Driver Dashboard)
                    Expanded(
                      child: child,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo Area
          Padding(
            padding: const EdgeInsets.all(30.0),
            child: Row(
              children: const [
                Icon(Icons.directions_bus, color: Colors.white, size: 28),
                SizedBox(width: 12),
                Text(
                  'CAMPUS BUS SERVICE',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          // Nav Items
          if (userRole == 'DRIVER') ...[
            _buildNavItem(Icons.dashboard, 'DASHBOARD', 0, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverDashboardScreen()))),
            _buildNavItem(Icons.people, 'PASSENGERS', 1, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverPassengersScreen()))),
            _buildNavItem(Icons.how_to_reg, 'ATTENDANCE POLLS', 2, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverPollsScreen()))),
            _buildNavItem(Icons.payment, 'PAYMENTS', 3, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverPaymentsScreen()))),
            _buildNavItem(Icons.location_on, 'LIVE TRACKING', 4, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverTrackingScreen()))),
            _buildNavItem(Icons.notifications, 'NOTICES', 5, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => NoticeBoardScreen(isDriver: true, userName: userName)))),
          ] else ...[
            _buildNavItem(Icons.dashboard, 'DASHBOARD', 0, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen()))),
            _buildNavItem(Icons.check_circle_outline, 'AVAILABLE BUSES', 1, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentAvailableBusesScreen()))),
            _buildNavItem(Icons.directions_bus, 'MY BUS', 2, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentMyBusScreen()))),
            _buildNavItem(Icons.how_to_reg, 'ATTENDANCE POLLS', 3, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentPollsScreen()))),
            _buildNavItem(Icons.payment, 'PAYMENTS', 4, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentPaymentsScreen()))),
            _buildNavItem(Icons.location_on, 'LIVE TRACKING', 5, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentTrackingScreen()))),
            _buildNavItem(Icons.notifications, 'NOTICES', 6, context, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => NoticeBoardScreen(isDriver: false, userName: userName)))),
          ],
          
          const Spacer(),
          
          // Logout
          _buildNavItem(Icons.logout, 'LOGOUT', 9, context, isLogout: true),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String title, int index, BuildContext context, {bool isLogout = false, VoidCallback? onTap}) {
    final isActive = index == activeIndex;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isActive ? Colors.white.withOpacity(0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive ? Colors.white : Colors.white54,
          size: 20,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.white54,
            fontSize: 10,
            letterSpacing: 1.2,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        onTap: () async {
          if (isLogout) {
            await ApiService.logout();
            if (!context.mounted) return;
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
              (route) => false,
            );
            return;
          }
          if (onTap != null && !isActive) {
            onTap();
          }
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _buildHeaderLink('ABOUT US', context),
          _buildHeaderLink('SERVICES', context),
          _buildHeaderLink('FAQS', context),
          _buildHeaderLink('CONTACT', context),
          const SizedBox(width: 20),
          const Icon(Icons.notifications_none, color: Colors.white, size: 24),
          const SizedBox(width: 20),
          
          // Profile
          MouseRegion(
            cursor: SystemMouseCursors.click,
            child: GestureDetector(
              onTap: () {
                if (userRole == 'DRIVER') {
                  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverProfileScreen()));
                } else {
                  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentProfileScreen()));
                }
              },
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Colors.white24,
                    child: Icon(Icons.person, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName,
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        userRole,
                        style: const TextStyle(color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(width: 10),
                  const Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 16),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildHeaderLink(String text, BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () {
          if (text == 'HOME') {
            if (userRole == 'DRIVER') {
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverDashboardScreen()));
            } else {
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen()));
            }
          } else if (text == 'ABOUT US') {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AboutUsScreen()));
          } else if (text == 'SERVICES') {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const ServicesScreen()));
          } else if (text == 'FAQS') {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const FaqsScreen()));
          } else if (text == 'CONTACT') {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const ContactScreen()));
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 15),
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ),
    );
  }
}
