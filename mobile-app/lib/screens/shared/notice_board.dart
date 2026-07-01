import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class NoticeBoardScreen extends StatelessWidget {
  final bool isDriver;
  final String userName;

  const NoticeBoardScreen({
    Key? key,
    required this.isDriver,
    required this.userName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: userName,
      userRole: isDriver ? 'Driver' : 'Student',
      activeIndex: 5, // 5 corresponds to NOTICES
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
                      'NOTICE BOARD',
                      style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                    ),
                    SizedBox(height: 5),
                    Text(
                      "IMPORTANT UPDATES AND ANNOUNCEMENTS",
                      style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
                    ),
                  ],
                ),
                if (isDriver)
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add_alert, size: 18),
                    label: const Text('POST NOTICE', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    onPressed: () {
                      // Post notice modal
                    },
                  ),
              ],
            ),
            const SizedBox(height: 40),

            // Notices Grid/List
            Expanded(
              child: ListView(
                children: [
                  _buildNoticeCard(
                    title: 'Delayed Departure Today',
                    content: 'Due to heavy traffic on High Level road, the bus will start 15 minutes late from the origin point. Please be at your pickup locations accordingly.',
                    date: 'Today, 06:15 AM',
                    author: isDriver ? 'You' : 'Chaminda Dias',
                    isUrgent: true,
                  ),
                  const SizedBox(height: 20),
                  _buildNoticeCard(
                    title: 'June Monthly Payments',
                    content: 'A gentle reminder to all students to complete their monthly payments for June by the 5th. You can use the in-app payment feature to quickly settle the amount.',
                    date: 'Yesterday, 08:30 PM',
                    author: isDriver ? 'You' : 'Chaminda Dias',
                    isUrgent: false,
                  ),
                  const SizedBox(height: 20),
                  _buildNoticeCard(
                    title: 'New Pickup Route Trial',
                    content: 'Starting next week, we will be trying out a slightly modified route through Nugegoda to avoid morning congestion. Check the app for updated pickup times.',
                    date: 'May 28, 2026',
                    author: isDriver ? 'You' : 'Chaminda Dias',
                    isUrgent: false,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoticeCard({
    required String title,
    required String content,
    required String date,
    required String author,
    required bool isUrgent,
  }) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isUrgent ? Colors.redAccent.withOpacity(0.5) : Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (isUrgent) ...[
                    const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 20),
                    const SizedBox(width: 10),
                  ],
                  Text(
                    title,
                    style: TextStyle(
                      color: isUrgent ? Colors.redAccent : Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                date,
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            content,
            style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: Colors.white24,
                radius: 12,
                child: Icon(Icons.person, color: Colors.white, size: 14),
              ),
              const SizedBox(width: 10),
              Text(
                'Posted by $author',
                style: const TextStyle(color: Colors.white54, fontSize: 12, fontStyle: FontStyle.italic),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
