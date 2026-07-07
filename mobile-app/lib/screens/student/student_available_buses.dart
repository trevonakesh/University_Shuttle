import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentAvailableBusesScreen extends StatefulWidget {
  const StudentAvailableBusesScreen({Key? key}) : super(key: key);

  @override
  State<StudentAvailableBusesScreen> createState() => _StudentAvailableBusesScreenState();
}

class _StudentAvailableBusesScreenState extends State<StudentAvailableBusesScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _buses = [];
  List<dynamic> _myRequests = [];
  bool _isLoading = true;
  bool _isRequesting = false;

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
    setState(() {
      _isRequesting = true;
    });

    final result = await ApiService.createSeatRequest(driverId);

    if (mounted) {
      setState(() {
        _isRequesting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['success'] ? 'Seat request sent successfully!' : result['message']),
          backgroundColor: result['success'] ? Colors.green : Colors.redAccent,
        ),
      );
      if (result['success']) _fetchData();
    }
  }

  Future<void> _unassignDriver(int requestId) async {
    setState(() {
      _isRequesting = true;
    });

    final success = await ApiService.deleteSeatRequest(requestId);
    
    if (mounted) {
      setState(() {
        _isRequesting = false;
      });
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unassigned successfully!', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
        _fetchData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to unassign', style: TextStyle(color: Colors.white)), backgroundColor: Colors.redAccent));
      }
    }
  }

  Widget _buildBusCard(Map<String, dynamic> bus) {
    int driverId = bus['id'];
    int? requestId;
    bool hasRequestedThis = false;
    bool hasActiveRequestAnywhere = false;

    for (var req in _myRequests) {
      if (req['status'] == 'PENDING' || req['status'] == 'APPROVED') {
        hasActiveRequestAnywhere = true;
        if (req['driverId'] == driverId) {
          hasRequestedThis = true;
          requestId = req['id'];
        }
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Bus Image (1:1 Thumbnail)
            AspectRatio(
              aspectRatio: 1,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white10,
                  image: bus['busPhotoUrl'] != null
                    ? DecorationImage(
                        image: NetworkImage(bus['busPhotoUrl']),
                        fit: BoxFit.cover,
                      )
                    : null,
                ),
                child: bus['busPhotoUrl'] == null
                  ? const Center(child: Icon(Icons.directions_bus, color: Colors.white24, size: 40))
                  : null,
              ),
            ),
            
            // Bus Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bus['routeName'] ?? 'Unknown Route',
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(Icons.person, color: Colors.white54, size: 16),
                          const SizedBox(width: 8),
                          Text('Driver: ${bus['fullName'] ?? 'Unknown'}', style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          const Icon(Icons.confirmation_number, color: Colors.white54, size: 16),
                          const SizedBox(width: 8),
                          Text('Reg: ${bus['busRegNumber'] ?? 'N/A'}', style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.access_time, color: Colors.white54, size: 16),
                          const SizedBox(width: 8),
                          Text(bus['pickupTime'] ?? 'N/A', style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          const Icon(Icons.event_seat, color: Colors.white54, size: 16),
                          const SizedBox(width: 8),
                          Text('Seats: ${bus['busCapacity'] ?? 'N/A'}', style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          const Icon(Icons.attach_money, color: Colors.white54, size: 16),
                          const SizedBox(width: 8),
                          Text(bus['monthlyFee'] != null ? 'LKR ${bus['monthlyFee']}' : 'N/A', style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: _isRequesting ? null : (hasRequestedThis ? () => _unassignDriver(requestId!) : (hasActiveRequestAnywhere ? null : () => _requestSeat(bus['id']))),
                    icon: Icon(hasRequestedThis ? Icons.cancel : Icons.send, color: Colors.white),
                    label: Text(hasRequestedThis ? 'UNASSIGN' : (hasActiveRequestAnywhere ? 'UNAVAILABLE' : 'REQUEST SEAT'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: hasRequestedThis ? Colors.redAccent : (hasActiveRequestAnywhere ? Colors.white24 : Colors.blueAccent),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF12141D),
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    final profile = _user?['profile'] ?? _user?['student'] ?? {};
    final name = profile['fullName'] ?? 'Student';

    return DashboardLayout(
      userName: name,
      userRole: 'STUDENT',
      activeIndex: 1, // 'AVAILABLE BUSES' index
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'AVAILABLE BUSES',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 40),
            if (_buses.isEmpty)
              const Expanded(
                child: Center(
                  child: Text('No buses available at the moment.', style: TextStyle(color: Colors.white54, fontSize: 18)),
                ),
              )
            else
              Expanded(
                child: ListView.builder(
                  itemCount: _buses.length,
                  itemBuilder: (context, index) {
                    return _buildBusCard(_buses[index]);
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
