import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverProfileScreen extends StatefulWidget {
  const DriverProfileScreen({Key? key}) : super(key: key);

  @override
  State<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends State<DriverProfileScreen> {
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.fetchMe();
    
    if (mounted) {
      setState(() {
        _user = user;
        _isLoading = false;
      });
    }
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.white54, size: 24),
          const SizedBox(width: 20),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF12141D),
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    final profile = _user?['profile'] ?? _user?['driver'] ?? {};
    final name = profile['fullName'] ?? 'Driver';

    return DashboardLayout(
      userName: name,
      userRole: 'DRIVER',
      activeIndex: 6, // Profile is index 6
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'MY PROFILE',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 40),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar Column
                    Column(
                      children: [
                        Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white24, width: 2),
                            image: profile['profilePhotoUrl'] != null 
                              ? DecorationImage(
                                  image: NetworkImage(profile['profilePhotoUrl'].startsWith('http') 
                                      ? profile['profilePhotoUrl']
                                      : '${ApiService.origin}${profile['profilePhotoUrl']}'),
                                  fit: BoxFit.cover,
                                )
                              : null,
                          ),
                          child: profile['profilePhotoUrl'] == null
                            ? const Icon(Icons.person, color: Colors.white, size: 80)
                            : null,
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.green),
                          ),
                          child: Text(
                            profile['status'] ?? 'APPROVED',
                            style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 60),
                    // Details Column
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'PERSONAL INFORMATION',
                              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            const Divider(color: Colors.white24, height: 30),
                            _buildInfoRow('FULL NAME', profile['fullName'] ?? 'Not set', Icons.badge),
                            _buildInfoRow('EMAIL', _user?['email'] ?? 'Not set', Icons.email),
                            _buildInfoRow('PHONE', _user?['phone'] ?? 'Not set', Icons.phone),
                            _buildInfoRow('NIC NUMBER', profile['nic'] ?? 'Not set', Icons.credit_card),
                            
                            const SizedBox(height: 40),
                            const Text(
                              'VEHICLE & ROUTE INFORMATION',
                              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            const Divider(color: Colors.white24, height: 30),
                            _buildInfoRow('BUS REGISTRATION', profile['busRegNumber'] ?? 'Not set', Icons.directions_bus),
                            _buildInfoRow('LICENSE NUMBER', profile['licenseNumber'] ?? 'Not set', Icons.card_membership),
                            _buildInfoRow('ROUTE', profile['routeName'] ?? 'Not set', Icons.route),
                            _buildInfoRow('SEATING CAPACITY', profile['busCapacity']?.toString() ?? 'Not set', Icons.event_seat),
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
