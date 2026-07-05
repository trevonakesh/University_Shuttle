import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverPassengersScreen extends StatefulWidget {
  const DriverPassengersScreen({Key? key}) : super(key: key);

  @override
  State<DriverPassengersScreen> createState() => _DriverPassengersScreenState();
}

class _DriverPassengersScreenState extends State<DriverPassengersScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _passengers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    final requests = await ApiService.getDriverRequests();
    
    if (mounted) {
      setState(() {
        _user = user;
        // Filter for only approved requests (actual passengers)
        _passengers = requests.where((r) => r['status'] == 'APPROVED').toList();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF12141D),
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    final profile = _user?['profile'] ?? _user?['driver'];
    final name = profile?['fullName'] ?? 'Driver';

    return DashboardLayout(
      userName: name,
      userRole: 'DRIVER',
      activeIndex: 1, // Passengers is index 1
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'MY PASSENGERS',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 10),
            Text(
              "TOTAL PASSENGERS: ${_passengers.length}",
              style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
            
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white24),
                ),
                child: _passengers.isEmpty
                    ? const Center(
                        child: Text(
                          'NO PASSENGERS YET',
                          style: TextStyle(color: Colors.white54, fontSize: 16),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: _passengers.length,
                        separatorBuilder: (context, index) => const Divider(color: Colors.white24, height: 1),
                        itemBuilder: (context, index) {
                          final p = _passengers[index];
                          final student = p['student'];
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            child: Row(
                              children: [
                                const CircleAvatar(
                                  backgroundColor: Colors.white10,
                                  radius: 25,
                                  child: Icon(Icons.person, color: Colors.white, size: 30),
                                ),
                                const SizedBox(width: 20),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(student['fullName'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                      const SizedBox(height: 4),
                                      Text('${student['universityName'] ?? 'Unknown Uni'} • ${student['pickupPoint'] ?? 'Unknown Pickup'}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.green),
                                  ),
                                  child: const Text('APPROVED', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
