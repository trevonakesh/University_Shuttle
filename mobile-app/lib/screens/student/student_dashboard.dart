import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({Key? key}) : super(key: key);

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _buses = [];
  List<dynamic> _myRequests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    final buses = await ApiService.getAvailableBuses();
    final requests = await ApiService.getStudentRequests();
    
    if (mounted) {
      setState(() {
        _user = user;
        _buses = buses;
        _myRequests = requests;
        _isLoading = false;
      });
    }
  }

  Future<void> _requestSeat(int driverId) async {
    // Show loading
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    
    final result = await ApiService.createSeatRequest(driverId);
    
    // Hide loading
    if (mounted) Navigator.pop(context);

    if (result['success']) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Seat requested successfully!')));
      _fetchData(); // Refresh requests
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
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

    final name = _user?['fullName'] ?? 'Student';
    final firstName = name.split(' ').first;
    
    // Find active request status
    String status = 'NO REQUEST';
    Color statusColor = Colors.grey;
    if (_myRequests.isNotEmpty) {
      final req = _myRequests.first;
      status = req['status'];
      if (status == 'PENDING') statusColor = Colors.orange;
      if (status == 'APPROVED') statusColor = Colors.green;
      if (status == 'REJECTED') statusColor = Colors.red;
    }

    return DashboardLayout(
      userName: name,
      userRole: 'STUDENT',
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
              children: [
                Text(
                  'GOOD MORNING, ${firstName.toUpperCase()}! ',
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const Icon(Icons.wb_sunny_outlined, color: Colors.white70, size: 20),
              ],
            ),
            const SizedBox(height: 5),
            const Text(
              "HERE'S WHAT'S HAPPENING WITH YOUR TRAVEL.",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 30),
            
            // Stats Row
            Row(
              children: [
                Expanded(child: _buildStatCard('SEAT STATUS', status, 'Current Booking', Icons.event_seat, statusColor)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('PAYMENT STATUS', 'PENDING', 'THIS MONTH', Icons.attach_money, Colors.orange)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('ACTIVE BUSES', _buses.length.toString(), 'AVAILABLE NOW', Icons.directions_bus, Colors.green)),
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
                          'AVAILABLE BUSES',
                          style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                        TextButton(
                          onPressed: _fetchData,
                          child: const Text('REFRESH', style: TextStyle(color: Colors.green, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: Colors.white24, height: 1),
                  if (_buses.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(40.0),
                      child: Text('NO BUSES AVAILABLE', style: TextStyle(color: Colors.white54)),
                    ),
                  ..._buses.map((bus) => Column(
                    children: [
                      _buildBusListItem(
                        bus['id'],
                        bus['routeName'] ?? 'Unknown Route',
                        bus['fullName'] ?? 'Driver',
                        'LKR ${bus['monthlyFee'] ?? '0'}',
                        _myRequests.any((req) => req['driverId'] == bus['id'] && req['status'] == 'APPROVED'),
                      ),
                      const Divider(color: Colors.white24, height: 1),
                    ],
                  )).toList(),
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

  Widget _buildBusListItem(int driverId, String route, String driver, String price, bool isAvailable) {
    // Check if the student already has a pending/approved request for this driver
    bool hasRequested = _myRequests.any((req) => 
      req['driverId'] == driverId && 
      (req['status'] == 'PENDING' || req['status'] == 'APPROVED')
    );

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
                isAvailable ? 'ACTIVE' : 'UNAVAILABLE',
                style: const TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(width: 40),
          
          // Button
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: hasRequested ? Colors.grey : Colors.white,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20),
            ),
            onPressed: (isAvailable && !hasRequested) ? () => _requestSeat(driverId) : null,
            child: Text(hasRequested ? 'REQUESTED' : 'REQUEST SEAT', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10)),
          ),
        ],
      ),
    );
  }
}
