import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentMyBusScreen extends StatefulWidget {
  const StudentMyBusScreen({Key? key}) : super(key: key);

  @override
  State<StudentMyBusScreen> createState() => _StudentMyBusScreenState();
}

class _StudentMyBusScreenState extends State<StudentMyBusScreen> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _myBus;
  bool _isLoading = true;
  bool _isRequesting = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    final requests = await ApiService.getStudentRequests();
    
    if (mounted) {
      setState(() {
        _user = user;
        try {
          final approved = requests.firstWhere((r) => r['status'] == 'APPROVED');
          _myBus = approved;
        } catch (e) {
          _myBus = null;
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _unassignDriver(int requestId) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1A1A24),
          title: const Text('Confirm Unassign', style: TextStyle(color: Colors.white)),
          content: const Text('Are you sure you want to unassign from this bus? You will need to request a seat again if you change your mind.', style: TextStyle(color: Colors.white70)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('UNASSIGN', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      }
    );

    if (confirm != true) return;

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

  Widget _buildInfoCard(String label, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.blueAccent, size: 24),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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

    final profile = _user?['profile'] ?? _user?['student'] ?? {};
    final name = profile['fullName'] ?? 'Student';
    final isNarrow = MediaQuery.of(context).size.width < 900;

    return DashboardLayout(
      userName: name,
      userRole: 'STUDENT',
      activeIndex: 2, // 'MY BUS' index
      child: Padding(
        padding: EdgeInsets.all(isNarrow ? 20.0 : 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'MY ASSIGNED BUS',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 40),
            if (_myBus == null)
              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.directions_bus_filled_outlined, color: Colors.white24, size: 80),
                      SizedBox(height: 20),
                      Text('You don\'t have an assigned bus yet.', style: TextStyle(color: Colors.white54, fontSize: 18)),
                      SizedBox(height: 10),
                      Text('Check the "AVAILABLE BUSES" tab to request a seat.', style: TextStyle(color: Colors.white54, fontSize: 14)),
                    ],
                  ),
                ),
              )
              else
                Builder(builder: (context) {
                  final driverContainer = Container(
                    padding: EdgeInsets.all(isNarrow ? 20 : 30),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 40,
                              backgroundColor: Colors.white10,
                              backgroundImage: ApiService.resolveUrl(_myBus!['driver']['profilePhotoUrl']) != null
                                ? NetworkImage(ApiService.resolveUrl(_myBus!['driver']['profilePhotoUrl'])!)
                                : null,
                              child: ApiService.resolveUrl(_myBus!['driver']['profilePhotoUrl']) == null
                                ? const Icon(Icons.person, color: Colors.white54, size: 40)
                                : null,
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('YOUR DRIVER', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1)),
                                  Text(_myBus!['driver']['fullName'] ?? 'Unknown Driver', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 5),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                                    child: const Text('APPROVED', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 30),
                        _buildInfoCard('Contact Number', _myBus!['driver']['user']?['phone'] ?? 'N/A', Icons.phone),
                        _buildInfoCard('NIC', _myBus!['driver']['nic'] ?? 'N/A', Icons.badge),
                        if (!isNarrow) const Spacer() else const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.chat, color: Colors.white),
                            label: const Text('MESSAGE DRIVER', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blueAccent,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _isRequesting ? null : () => _unassignDriver(_myBus!['id']),
                            icon: const Icon(Icons.cancel, color: Colors.white),
                            label: const Text('UNASSIGN BUS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );

                  final busContainer = Container(
                    padding: EdgeInsets.all(isNarrow ? 20 : 30),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Builder(builder: (context) {
                          final busPhotoUrl = ApiService.resolveUrl(_myBus!['driver']['busPhotoUrl']);
                          return Container(
                            height: 200,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white10,
                              borderRadius: BorderRadius.circular(15),
                              image: busPhotoUrl != null
                                ? DecorationImage(
                                    image: NetworkImage(busPhotoUrl),
                                    fit: BoxFit.cover,
                                    onError: (_, __) {},
                                  )
                                : null,
                            ),
                            child: busPhotoUrl == null
                              ? const Icon(Icons.directions_bus, color: Colors.white24, size: 80)
                              : null,
                          );
                        }),
                        const SizedBox(height: 30),
                        _buildInfoCard('Bus Registration', _myBus!['driver']['busRegNumber'] ?? 'N/A', Icons.confirmation_number),
                        _buildInfoCard('Route', _myBus!['driver']['routeName'] ?? 'N/A', Icons.route),
                        _buildInfoCard('Destination', _myBus!['driver']['destination'] ?? 'N/A', Icons.flag),
                        _buildInfoCard('Pickup Time', _myBus!['driver']['pickupTime'] ?? 'N/A', Icons.access_time),
                      ],
                    ),
                  );

                  return Expanded(
                    child: isNarrow
                        ? ListView(
                            children: [
                              driverContainer,
                              const SizedBox(height: 20),
                              busContainer,
                            ],
                          )
                        : Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: driverContainer),
                              const SizedBox(width: 30),
                              Expanded(child: busContainer),
                            ],
                          ),
                  );
                }),
          ],
        ),
      ),
    );
  }
}
