import 'package:flutter/material.dart';
import '../../utils/palette.dart';
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

    final profile = _user?['profile'] ?? _user?['driver'] ?? {};
    final name = profile['fullName'] ?? 'Driver';

    // On a phone the avatar sits above the details instead of beside them.
    final narrow = MediaQuery.of(context).size.width < 700;

    return DashboardLayout(
      userName: name,
      userRole: 'DRIVER',
      activeIndex: 6, // Profile is index 6
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
                            ? Icon(Icons.person, color: context.pal.fg, size: narrow ? 50 : 80)
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
                            _buildInfoRow('NIC NUMBER', profile['nic'] ?? 'Not set', Icons.credit_card),
                            
                            const SizedBox(height: 40),
                            Text(
                              'VEHICLE & ROUTE INFORMATION',
                              style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            Divider(color: context.pal.fg24, height: 30),
                            if (_filled(profile['busRegNumber'])) _buildInfoRow('BUS REGISTRATION', profile['busRegNumber'], Icons.directions_bus),
                            if (_filled(profile['licenseNumber'])) _buildInfoRow('LICENSE NUMBER', profile['licenseNumber'], Icons.card_membership),
                            if (_filled(profile['routeName'])) _buildInfoRow('ROUTE', profile['routeName'], Icons.route),
                            if (_filled(profile['busCapacity'])) _buildInfoRow('SEATING CAPACITY', profile['busCapacity'].toString(), Icons.event_seat),
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
