import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentProfileScreen extends StatefulWidget {
  const StudentProfileScreen({Key? key}) : super(key: key);

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> {
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    
    if (mounted) {
      setState(() {
        _user = user;
        _isLoading = false;
      });
    }
  }

  // Details an admin removed from sign-up are left blank, so their rows are skipped.
  bool _filled(dynamic value) => value != null && value.toString().isNotEmpty;

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Icon(icon, color: context.pal.fg54, size: 24),
          const SizedBox(width: 20),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(color: context.pal.fg54, fontSize: 12, letterSpacing: 1),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(color: context.pal.fg, fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ],
          )),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: context.pal.bg,
        body: Center(child: CircularProgressIndicator(color: context.pal.fg)),
      );
    }

    final profile = _user?['profile'] ?? _user?['student'] ?? {};
    final name = profile['fullName'] ?? 'Student';

    // On a phone the avatar sits above the details instead of beside them.
    final narrow = MediaQuery.of(context).size.width < 700;

    return DashboardLayout(
      userName: name,
      userRole: 'STUDENT',
      activeIndex: -1, // Profile is accessed via top header, no sidebar index
      child: Padding(
        padding: EdgeInsets.all(narrow ? 16 : 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MY PROFILE',
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            SizedBox(height: narrow ? 20 : 40),
            Expanded(
              child: Container(
                padding: EdgeInsets.all(narrow ? 20 : 40),
                decoration: BoxDecoration(
                  color: context.pal.tint(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: context.pal.fg24),
                ),
                child: Flex(
                  direction: narrow ? Axis.vertical : Axis.horizontal,
                  crossAxisAlignment: narrow ? CrossAxisAlignment.stretch : CrossAxisAlignment.start,
                  children: [
                    // Avatar Column
                    Column(
                      children: [
                        Container(
                          width: narrow ? 96 : 150,
                          height: narrow ? 96 : 150,
                          decoration: BoxDecoration(
                            color: context.pal.fg12,
                            shape: BoxShape.circle,
                            border: Border.all(color: context.pal.fg24, width: 2),
                          ),
                          child: Icon(Icons.school, color: context.pal.fg, size: narrow ? 50 : 80),
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.blue),
                          ),
                          child: Text(
                            profile['studentId'] ?? 'ENROLLED',
                            style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(width: narrow ? 0 : 60, height: narrow ? 20 : 0),
                    // Details Column
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'PERSONAL INFORMATION',
                              style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            Divider(color: context.pal.fg24, height: 30),
                            _buildInfoRow('FULL NAME', profile['fullName'] ?? 'Not set', Icons.badge),
                            _buildInfoRow('EMAIL', _user?['email'] ?? 'Not set', Icons.email),
                            _buildInfoRow('PHONE', _user?['phone'] ?? 'Not set', Icons.phone),
                            if (_filled(profile['nic'])) _buildInfoRow('NIC NUMBER', profile['nic'], Icons.credit_card),
                            
                            const SizedBox(height: 40),
                            Text(
                              'ACADEMIC INFORMATION',
                              style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            Divider(color: context.pal.fg24, height: 30),
                            _buildInfoRow('UNIVERSITY', profile['universityName'] ?? 'Not set', Icons.account_balance),
                            if (_filled(profile['faculty'])) _buildInfoRow('FACULTY', profile['faculty'], Icons.domain),
                            if (_filled(profile['degreeProgram'])) _buildInfoRow('PROGRAM', profile['degreeProgram'], Icons.book),
                            if (_filled(profile['academicYear'])) _buildInfoRow('YEAR', profile['academicYear'], Icons.school),

                            const SizedBox(height: 40),
                            Text(
                              'TRAVEL INFORMATION',
                              style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            Divider(color: context.pal.fg24, height: 30),
                            if (_filled(profile['homeLocation'])) _buildInfoRow('HOME LOCATION', profile['homeLocation'], Icons.home),
                            _buildInfoRow('PICKUP POINT', profile['pickupPoint'] ?? 'Not set', Icons.location_on),
                            _buildInfoRow('DESTINATION', profile['destination'] ?? 'Not set', Icons.flag),
                          ],
                        ),
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
}
