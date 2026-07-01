import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class StudentDashboardScreen extends StatelessWidget {
  const StudentDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: 'Supun Perera',
      userRole: 'Student',
      activeIndex: 0,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            const Text(
              'DASHBOARD',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 10),
            Row(
              children: const [
                Text(
                  'GOOD MORNING, SUPUN! ',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Icon(Icons.wb_sunny_outlined, color: Colors.white70, size: 20),
              ],
            ),
            const SizedBox(height: 5),
            const Text(
              "HERE'S WHAT'S HAPPENING WITH YOUR TRAVEL.",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 30),
            
            // Search Bar
            Container(
              height: 50,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: Colors.white30),
              ),
              child: Row(
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20),
                    child: Icon(Icons.search, color: Colors.white54),
                  ),
                  Expanded(
                    child: TextField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        hintText: 'SEARCH FOR ROUTES AND BUSES...',
                        hintStyle: TextStyle(color: Colors.white54, fontSize: 12),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(5.0),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 25),
                      ),
                      onPressed: () {},
                      child: const Text('SEARCH', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            
            // Stats Row
            Row(
              children: [
                Expanded(child: _buildStatCard('MY BUS STATUS', 'ACTIVE', 'WENNAPPUWA - NSBM', Icons.assignment, Colors.green)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('PAYMENT STATUS', 'PAID', 'NEXT: 2026-07-01', Icons.attach_money, Colors.green)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('NEXT TRIP', 'TOMORROW', '7.00 AM', Icons.calendar_today, Colors.green)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('ATTENDANCE POLL', 'OPEN', 'RESPOND NOW', Icons.chat_bubble_outline, Colors.green)),
              ],
            ),
            const SizedBox(height: 40),
            
            // Available Buses Near You
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white24),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'AVAILABLE BUSES NEAR YOU',
                          style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                        TextButton(
                          onPressed: () {},
                          child: const Text('VIEW ALL', style: TextStyle(color: Colors.green, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: Colors.white24, height: 1),
                  _buildBusListItem('WENNAPPUWA - NSBM', 'Chaminda Dias', 'LKR 4,500', true),
                  const Divider(color: Colors.white24, height: 1),
                  _buildBusListItem('DANKOTUWA - NSBM', 'Nimal Fernando', 'LKR 4,000', true),
                  const Divider(color: Colors.white24, height: 1),
                  _buildBusListItem('KANDY - NSBM', 'Ovin Perera', 'LKR 5,000', false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, String subtitle, IconData icon, Color statusColor) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(25),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: Colors.white54, size: 30),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1)),
                    const SizedBox(height: 5),
                    Text(value, style: TextStyle(color: statusColor, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 5),
                    Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 10)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBusListItem(String route, String driver, String price, bool isAvailable) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      child: Row(
        children: [
          // Bus Icon/Thumbnail
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.directions_bus, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 20),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(route, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('DRIVER: $driver', style: const TextStyle(color: Colors.white54, fontSize: 10)),
                const SizedBox(height: 4),
                Text('$price / MONTH', style: const TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
          
          // Status
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isAvailable ? Colors.green : Colors.red,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                isAvailable ? 'SEATS AVAILABLE' : 'FULLY BOOKED',
                style: const TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(width: 40),
          
          // Button
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20),
            ),
            onPressed: () {},
            child: const Text('VIEW DETAILS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10)),
          ),
        ],
      ),
    );
  }
}
