import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

import '../../utils/lang.dart';
class _InfoBaseScreen extends StatefulWidget {
  final String title;
  final Widget content;

  const _InfoBaseScreen({Key? key, required this.title, required this.content}) : super(key: key);

  @override
  State<_InfoBaseScreen> createState() => _InfoBaseScreenState();
}

class _InfoBaseScreenState extends State<_InfoBaseScreen> {
  String _userName = 'User';
  String _userRole = 'STUDENT';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    final user = await ApiService.getUser();
    final role = await ApiService.getRole();
    if (mounted) {
      setState(() {
        if (user != null) {
          final profile = user['profile'] ?? user['driver'] ?? user['student'] ?? {};
          _userName = profile['fullName'] ?? 'User';
        }
        if (role != null) _userRole = role;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: context.pal.bg,
        body: Center(child: CircularProgressIndicator(color: context.pal.fg)),
      );
    }

    return DashboardLayout(
      userName: _userName,
      userRole: _userRole,
      activeIndex: -1, // No sidebar item active
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              tr(widget.title),
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 40),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: context.pal.tint(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: context.pal.fg24),
                ),
                child: SingleChildScrollView(
                  child: widget.content,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AboutUsScreen extends StatelessWidget {
  const AboutUsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return _InfoBaseScreen(
      title: tr('ABOUT US'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'UniShuttle',
            style: TextStyle(color: context.pal.fg, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 20),
          Text(
            tr('Welcome to UniShuttle, your reliable partner in university transportation. We are committed to providing safe, efficient, and comfortable daily commuting solutions for students across multiple universities.'),
            style: TextStyle(color: context.pal.fg70, fontSize: 16, height: 1.5),
          ),
          SizedBox(height: 20),
          Text(
            tr('Our Mission'),
            style: TextStyle(color: context.pal.fg, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 10),
          Text(
            tr('To ensure that no student misses a class due to transit issues. We bridge the gap between your home and campus with our modern fleet of buses and dedicated drivers.'),
            style: TextStyle(color: context.pal.fg70, fontSize: 16, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return _InfoBaseScreen(
      title: tr('OUR SERVICES'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildServiceItem(context, Icons.directions_bus, 'Daily Commutes', 'Regularly scheduled buses ensuring you reach the campus on time.'),
          const SizedBox(height: 20),
          _buildServiceItem(context, Icons.location_on, 'Live Tracking', 'Track your bus in real-time through our mobile application.'),
          const SizedBox(height: 20),
          _buildServiceItem(context, Icons.payment, 'Seamless Payments', 'Pay for your monthly passes easily using our integrated wallet.'),
          const SizedBox(height: 20),
          _buildServiceItem(context, Icons.how_to_reg, 'Smart Attendance', 'Automated check-ins and polls to secure your seat everyday.'),
        ],
      ),
    );
  }

  Widget _buildServiceItem(BuildContext context, IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: context.pal.green, size: 30),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr(title), style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(tr(description), style: TextStyle(color: context.pal.fg54, fontSize: 14, height: 1.5)),
            ],
          ),
        ),
      ],
    );
  }
}

class FaqsScreen extends StatelessWidget {
  const FaqsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return _InfoBaseScreen(
      title: tr('FREQUENTLY ASKED QUESTIONS'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFaqItem(context, 'How do I request a seat on a bus?', 'Go to the "Available Buses" section on your student dashboard, find a route that matches yours, and tap "Request Seat".'),
          _buildFaqItem(context, 'How do I track my bus?', 'Once your request is approved, go to the "Live Tracking" section on your dashboard to see your bus\'s real-time location.'),
          _buildFaqItem(context, 'Can I cancel a seat request?', 'Yes, you can cancel your request from your dashboard as long as the bus hasn\'t started its route for the day.'),
          _buildFaqItem(context, 'How does the payment system work?', 'You can top up your in-app wallet via various payment methods, and your monthly fees will be automatically deducted based on your usage.'),
        ],
      ),
    );
  }

  Widget _buildFaqItem(BuildContext context, String question, String answer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 25.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr(question), style: TextStyle(color: context.pal.fg, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(tr(answer), style: TextStyle(color: context.pal.fg54, fontSize: 14, height: 1.5)),
        ],
      ),
    );
  }
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return _InfoBaseScreen(
      title: tr('CONTACT US'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr('Get In Touch'),
            style: TextStyle(color: context.pal.fg, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Text(
            tr('Have a question or facing an issue? Reach out to our support team.'),
            style: TextStyle(color: context.pal.fg70, fontSize: 16, height: 1.5),
          ),
          const SizedBox(height: 40),
          // Same details as the website (web-app/src/lib/business.ts).
          _buildContactRow(context, Icons.email, 'Email Support', 'info@unishuttle.lk'),
          const SizedBox(height: 20),
          _buildContactRow(context, Icons.location_on, 'Location', 'Colombo, Sri Lanka'),
        ],
      ),
    );
  }

  Widget _buildContactRow(BuildContext context, IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: context.pal.fg12,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: context.pal.fg, size: 24),
        ),
        const SizedBox(width: 20),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tr(label), style: TextStyle(color: context.pal.fg54, fontSize: 12, letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(tr(value), style: TextStyle(color: context.pal.fg, fontSize: 16, fontWeight: FontWeight.w500)),
          ],
        ),
      ],
    );
  }
}
