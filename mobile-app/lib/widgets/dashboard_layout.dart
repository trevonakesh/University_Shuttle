import 'dart:ui';
import 'package:flutter/material.dart';

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
          _buildNavItem(Icons.dashboard, 'DASHBOARD', 0, context),
          _buildNavItem(Icons.check_circle_outline, 'AVAILABLE BUSES', 1, context),
          _buildNavItem(Icons.directions_bus, 'MY BUS', 2, context),
          _buildNavItem(Icons.how_to_reg, 'ATTENDANCE POLLS', 3, context),
          _buildNavItem(Icons.payment, 'PAYMENTS', 4, context),
          _buildNavItem(Icons.location_on, 'LIVE TRACKING', 5, context),
          _buildNavItem(Icons.notifications, 'NOTICES', 6, context),
          _buildNavItem(Icons.person, 'PROFILE', 7, context),
          _buildNavItem(Icons.settings, 'SETTINGS', 8, context),
          
          const Spacer(),
          
          // Logout
          _buildNavItem(Icons.logout, 'LOGOUT', 9, context, isLogout: true),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String title, int index, BuildContext context, {bool isLogout = false}) {
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
        onTap: () {
          if (isLogout) {
            Navigator.pushReplacementNamed(context, '/login');
          }
          // Other navigation logic would go here
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
          _buildHeaderLink('HOME'),
          _buildHeaderLink('ABOUT US'),
          _buildHeaderLink('SERVICES'),
          _buildHeaderLink('FAQS'),
          _buildHeaderLink('CONTACT'),
          const SizedBox(width: 20),
          const Icon(Icons.notifications_none, color: Colors.white, size: 24),
          const SizedBox(width: 20),
          
          // Profile
          Row(
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
          )
        ],
      ),
    );
  }

  Widget _buildHeaderLink(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 10,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}
