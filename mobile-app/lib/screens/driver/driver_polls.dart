import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class DriverPollsScreen extends StatelessWidget {
  const DriverPollsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: 'Chaminda Dias',
      userRole: 'Driver',
      activeIndex: 6, // 6 corresponds to POLLS
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'ATTENDANCE POLLS',
                      style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                    ),
                    SizedBox(height: 5),
                    Text(
                      "MANAGE DAILY ATTENDANCE AND SEAT AVAILABILITY",
                      style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.add_chart, size: 18),
                  label: const Text('CREATE POLL', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: () {
                    // Create Poll Modal
                  },
                ),
              ],
            ),
            const SizedBox(height: 40),

            // Active Poll View
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white24),
                ),
                child: Column(
                  children: [
                    // Poll Header & Stats
                    Padding(
                      padding: const EdgeInsets.all(25.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text('Tomorrow, May 30', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                              SizedBox(height: 5),
                              Text('Are you coming tomorrow morning?', style: TextStyle(color: Colors.white70, fontSize: 14)),
                            ],
                          ),
                          Row(
                            children: [
                              _buildStatCard('COMING', '28', Colors.green),
                              const SizedBox(width: 15),
                              _buildStatCard('NOT COMING', '5', Colors.redAccent),
                              const SizedBox(width: 15),
                              _buildStatCard('PENDING', '12', Colors.orange),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const Divider(color: Colors.white24, height: 1),
                    
                    // Table Header
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Row(
                        children: const [
                          Expanded(flex: 3, child: Text('STUDENT NAME', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 3, child: Text('PICKUP POINT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Text('PHONE NUMBER', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                        ],
                      ),
                    ),
                    const Divider(color: Colors.white24, height: 1),
                    
                    // Passengers Coming List
                    Expanded(
                      child: ListView(
                        children: [
                          _buildComingPassengerRow('Supun Perera', 'Maharagama Clock Tower', '077 123 4567'),
                          const Divider(color: Colors.white10, height: 1),
                          _buildComingPassengerRow('Nimal Fernando', 'Nugegoda Supermarket', '071 987 6543'),
                          const Divider(color: Colors.white10, height: 1),
                          _buildComingPassengerRow('Ovin Perera', 'Pannipitiya Junction', '076 555 1234'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(count, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 5),
          Text(label, style: TextStyle(color: color.withOpacity(0.8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _buildComingPassengerRow(String name, String pickup, String phone) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Colors.white24,
                  radius: 16,
                  child: Icon(Icons.person, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 15),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(
            flex: 3,
            child: Row(
              children: [
                const Icon(Icons.location_on, color: Colors.white54, size: 14),
                const SizedBox(width: 8),
                Text(pickup, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Row(
              children: [
                const Icon(Icons.phone, color: Colors.white54, size: 14),
                const SizedBox(width: 8),
                Text(phone, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withOpacity(0.5)),
                ),
                child: const Text('COMING', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
