import 'package:flutter/material.dart';
import 'theme_mode_button.dart';
import 'language_button.dart';
import '../utils/palette.dart';
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
import 'app_background.dart';
import 'profile_avatar.dart';

import '../utils/lang.dart';
class DashboardLayout extends StatelessWidget {
  final Widget child;
  final String userName;
  final String userRole;
  final int activeIndex;

  static const double _mobileBreakpoint = 900;

  const DashboardLayout({
    Key? key,
    required this.child,
    required this.userName,
    required this.userRole,
    this.activeIndex = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < _mobileBreakpoint;
    return isMobile ? _buildMobile(context) : _buildDesktop(context);
  }

  Widget _buildDesktop(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AppBackground(),

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

  Widget _buildMobile(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.pal.bar,
        iconTheme: IconThemeData(color: context.pal.fg),
        // Shrinks rather than cuts off when the phone is narrow.
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Text(
            'UNI SHUTTLE',
            style: TextStyle(color: context.pal.fg, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.2),
          ),
        ),
        actions: [
          const LanguageButton(),
          const ThemeModeButton(),
          IconButton(
            icon: Icon(Icons.notifications_none, color: context.pal.fg),
            onPressed: () => _showNotifications(context),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12, left: 4),
            child: GestureDetector(
              onTap: () => _openProfile(context),
              child: const ProfileAvatar(radius: 16),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: context.pal.bg,
        child: SafeArea(child: _buildSidebar(context, inDrawer: true)),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AppBackground(),
          child,
        ],
      ),
    );
  }

  void _openProfile(BuildContext context) {
    if (userRole == 'DRIVER') {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DriverProfileScreen()));
    } else {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentProfileScreen()));
    }
  }

  void _showNotifications(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: context.pal.surface,
          title: Text(tr('NOTIFICATIONS'), style: TextStyle(color: context.pal.fg, fontSize: 14, letterSpacing: 1)),
          content: SizedBox(
            width: 400,
            child: FutureBuilder<List<dynamic>>(
              future: ApiService.getNotifications(),
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return SizedBox(
                    height: 80,
                    child: Center(child: CircularProgressIndicator(color: context.pal.fg)),
                  );
                }
                final notifications = snapshot.data ?? [];
                if (notifications.isEmpty) {
                  return SizedBox(
                    height: 80,
                    child: Center(child: Text(tr('No notifications yet.'), style: TextStyle(color: context.pal.fg54))),
                  );
                }
                return SizedBox(
                  height: 300,
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final n = notifications[index];
                      final isRead = n['isRead'] == true;
                      return ListTile(
                        leading: Icon(
                          isRead ? Icons.notifications_none : Icons.notifications_active,
                          color: isRead ? context.pal.fg38 : context.pal.orange,
                        ),
                        title: Text(tr(n['title'] ?? ''), style: TextStyle(color: isRead ? context.pal.fg54 : context.pal.fg, fontSize: 13)),
                        subtitle: Text(tr(n['message'] ?? ''), style: TextStyle(color: context.pal.fg38, fontSize: 11)),
                        onTap: isRead ? null : () => ApiService.markNotificationRead(n['id']),
                      );
                    },
                  ),
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(tr('CLOSE'), style: TextStyle(color: context.pal.fg)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSidebar(BuildContext context, {bool inDrawer = false}) {
    return Container(
      color: inDrawer ? Colors.transparent : context.pal.sidebar,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo Area
          Padding(
            padding: EdgeInsets.all(30.0),
            child: Row(
              children: [
                Image.asset('assets/images/logo_mark.png', height: 26),
                SizedBox(width: 12),
                Text(
                  tr('UNI SHUTTLE'),
                  style: TextStyle(
                    color: context.pal.fg,
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
        color: isActive ? (context.pal.isDark ? context.pal.tint(0.15) : const Color(0x1F0E7C66)) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive ? context.pal.fg : context.pal.fg54,
          size: 20,
        ),
        title: Text(
          tr(title),
          style: TextStyle(
            color: isActive ? context.pal.fg : context.pal.fg54,
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
          const LanguageButton(),
          const ThemeModeButton(),
          IconButton(
            icon: Icon(Icons.notifications_none, color: context.pal.fg, size: 24),
            onPressed: () => _showNotifications(context),
          ),
          const SizedBox(width: 20),

          // Profile
          MouseRegion(
            cursor: SystemMouseCursors.click,
            child: GestureDetector(
              onTap: () => _openProfile(context),
              child: Row(
                children: [
                  const ProfileAvatar(radius: 20),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr(userName),
                        style: TextStyle(color: context.pal.fg, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        tr(userRole),
                        style: TextStyle(color: context.pal.fg54, fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(width: 10),
                  Icon(Icons.keyboard_arrow_down, color: context.pal.fg54, size: 16),
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
          if (text == 'ABOUT US') {
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
            tr(text),
            style: TextStyle(
              color: context.pal.fg70,
              fontSize: 10,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ),
    );
  }
}
