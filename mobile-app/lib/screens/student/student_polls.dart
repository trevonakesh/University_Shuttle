import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class StudentPollsScreen extends StatelessWidget {
  const StudentPollsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: 'Supun Perera',
      userRole: 'Student',
      activeIndex: 6, // Let's use 6 for Polls/Attendance
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'ATTENDANCE POLLS',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            const Text(
              "CONFIRM YOUR SEAT FOR UPCOMING TRIPS",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            // Polls List
            Expanded(
              child: ListView(
                children: [
                  _buildPollCard(
                    date: 'Tomorrow, May 30',
                    driverName: 'Chaminda Dias',
                    question: 'Are you coming tomorrow morning?',
                    hasVoted: false,
                    isComing: null,
                  ),
                  const SizedBox(height: 20),
                  _buildPollCard(
                    date: 'Today, May 29',
                    driverName: 'Chaminda Dias',
                    question: 'Are you coming this evening?',
                    hasVoted: true,
                    isComing: true,
                  ),
                  const SizedBox(height: 20),
                  _buildPollCard(
                    date: 'Yesterday, May 28',
                    driverName: 'Chaminda Dias',
                    question: 'Are you coming tomorrow morning?',
                    hasVoted: true,
                    isComing: false,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPollCard({
    required String date,
    required String driverName,
    required String question,
    required bool hasVoted,
    bool? isComing,
  }) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                date,
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  const Icon(Icons.directions_bus, color: Colors.white54, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    driverName,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            question,
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
          const SizedBox(height: 25),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasVoted && isComing == true ? Colors.green : Colors.white10,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  onPressed: () {},
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, color: hasVoted && isComing == true ? Colors.white : Colors.white54, size: 18),
                      const SizedBox(width: 8),
                      const Text('YES, I AM COMING', style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasVoted && isComing == false ? Colors.redAccent : Colors.white10,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  onPressed: () {},
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cancel_outlined, color: hasVoted && isComing == false ? Colors.white : Colors.white54, size: 18),
                      const SizedBox(width: 8),
                      const Text('NO, I AM NOT', style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
