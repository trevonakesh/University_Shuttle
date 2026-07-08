import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentTrackingScreen extends StatefulWidget {
  const StudentTrackingScreen({Key? key}) : super(key: key);

  @override
  State<StudentTrackingScreen> createState() => _StudentTrackingScreenState();
}

class _StudentTrackingScreenState extends State<StudentTrackingScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _myRequests = [];
  IO.Socket? _socket;
  
  // Starting location in Colombo
  LatLng _busLocation = const LatLng(6.9271, 79.8612);
  bool _isBusOnline = false;
  String? _driverIdToTrack;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initUserAndSocket();
  }

  Future<void> _initUserAndSocket() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final requests = await ApiService.getStudentRequests();
    
    setState(() {
      _user = user;
      _myRequests = requests;
    });
    
    // Only track the driver the student is actually assigned to.
    if (requests.any((r) => r['status'] == 'APPROVED')) {
      final approvedReq = requests.firstWhere((r) => r['status'] == 'APPROVED');
      _driverIdToTrack = approvedReq['driverId'].toString();
    }

    // Connect to Socket.IO only when there is a bus to track.
    if (_driverIdToTrack != null) {
      final baseUrl = ApiService.baseUrl.replaceAll('/api', '');
      _socket = IO.io(baseUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
      });

      _socket!.connect();

      _socket!.onConnect((_) {
        _socket!.emit('joinStudentRoom', _driverIdToTrack);
      });

      _socket!.on('busLocationUpdate', (data) {
        if (mounted) {
          setState(() {
            _isBusOnline = true;
            _busLocation = LatLng(data['latitude'], data['longitude']);
          });
        }
      });
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = _user != null ? (_user!['profile'] ?? _user!['student'] ?? {}) : {};
    final hasApprovedDriver = _myRequests.any((r) => r['status'] == 'APPROVED');

    return DashboardLayout(
      userName: profile['fullName'] ?? 'Student',
      userRole: 'STUDENT',
      activeIndex: 5,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'LIVE BUS TRACKING',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            const Text(
              "TRACK YOUR BUS IN REAL-TIME AND VIEW ETA",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (!hasApprovedDriver)
              const Center(child: Text("You have to assign to a driver to use this feature.", style: TextStyle(color: Colors.white70, fontSize: 16)))
            else
              // Map and Info Area
              Expanded(
                child: Container(
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: Colors.white24, width: 1),
                ),
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: FlutterMap(
                        options: MapOptions(
                          initialCenter: _busLocation,
                          initialZoom: 14.0,
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.example.lankatrip',
                          ),
                          MarkerLayer(
                            markers: [
                              Marker(
                                point: _busLocation,
                                width: 40,
                                height: 40,
                                child: Icon(Icons.directions_bus, color: _isBusOnline ? Colors.blueAccent : Colors.grey, size: 40),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ETA Glassmorphic Panel
                    Positioned(
                      bottom: 30,
                      left: 30,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            width: 350,
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      backgroundColor: Colors.white12,
                                      radius: 20,
                                      child: Icon(Icons.directions_bus, color: Colors.white, size: 20),
                                    ),
                                    const SizedBox(width: 15),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Status', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                                        Text(_isBusOnline ? 'Online (Broadcasting)' : 'Offline', style: TextStyle(color: _isBusOnline ? Colors.green : Colors.red, fontSize: 12)),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 25),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildEtaStat('ETA', _isBusOnline ? '12 MINS' : '--', Colors.blueAccent),
                                    _buildEtaStat('DISTANCE', _isBusOnline ? '4.2 KM' : '--', Colors.green),
                                    _buildEtaStat('SPEED', _isBusOnline ? '35 KM/H' : '--', Colors.orange),
                                  ],
                                ),
                              ],
                            ),
                          ),
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

  Widget _buildEtaStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
        const SizedBox(height: 5),
        Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
