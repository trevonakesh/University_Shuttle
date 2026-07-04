import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverTrackingScreen extends StatefulWidget {
  const DriverTrackingScreen({Key? key}) : super(key: key);

  @override
  State<DriverTrackingScreen> createState() => _DriverTrackingScreenState();
}

class _DriverTrackingScreenState extends State<DriverTrackingScreen> with SingleTickerProviderStateMixin {
  bool _isBroadcasting = false;
  late AnimationController _pulseController;
  IO.Socket? _socket;
  Map<String, dynamic>? _user;
  
  // Starting location in Colombo
  LatLng _currentLocation = const LatLng(6.9271, 79.8612);
  Timer? _locationTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _initUserAndSocket();
  }
  
  Future<void> _initUserAndSocket() async {
    final user = await ApiService.getUser();
    setState(() {
      _user = user;
    });
    
    // Connect to Socket.IO
    final baseUrl = ApiService.baseUrl.replaceAll('/api', '');
    _socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    _socket!.connect();
    
    _socket!.onConnect((_) {
      print('Connected to Socket.IO server');
      if (_user != null && _user!['profile'] != null) {
        _socket!.emit('joinDriverRoom', _user!['profile']['id'].toString());
      }
    });
  }

  void _toggleBroadcasting() {
    setState(() {
      _isBroadcasting = !_isBroadcasting;
    });

    if (_isBroadcasting) {
      // Start fake movement timer
      _locationTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
        if (_user != null && _user!['profile'] != null && _socket != null && _socket!.connected) {
          // Fake movement slightly northeast
          setState(() {
            _currentLocation = LatLng(
              _currentLocation.latitude + 0.0005,
              _currentLocation.longitude + 0.0005,
            );
          });
          
          _socket!.emit('updateLocation', {
            'driverId': _user!['profile']['id'].toString(),
            'latitude': _currentLocation.latitude,
            'longitude': _currentLocation.longitude,
            'timestamp': DateTime.now().toIso8601String(),
          });
        }
      });
    } else {
      _locationTimer?.cancel();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _locationTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: _user != null ? _user!['profile']['fullName'] : 'Driver',
      userRole: 'DRIVER',
      activeIndex: 4,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'LIVE GPS TRACKING',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            const Text(
              "BROADCAST YOUR LOCATION TO YOUR PASSENGERS",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            // Map and Controls Area
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
                          initialCenter: _currentLocation,
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
                                point: _currentLocation,
                                width: 80,
                                height: 80,
                                child: _isBroadcasting 
                                  ? AnimatedBuilder(
                                      animation: _pulseController,
                                      builder: (context, child) {
                                        return Container(
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: Colors.blueAccent.withOpacity(0.2 - (_pulseController.value * 0.1)),
                                            border: Border.all(
                                              color: Colors.blueAccent.withOpacity(0.5 - (_pulseController.value * 0.3)),
                                              width: 2,
                                            ),
                                          ),
                                          child: const Center(
                                            child: Icon(Icons.directions_bus, color: Colors.blueAccent, size: 30),
                                          ),
                                        );
                                      },
                                    )
                                  : const Icon(Icons.directions_bus, color: Colors.grey, size: 30),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Controls Panel (Glassmorphic)
                    Positioned(
                      bottom: 30,
                      left: 30,
                      right: 30,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _isBroadcasting ? 'BROADCASTING LIVE' : 'LOCATION SHARING OFF',
                                        style: TextStyle(
                                          color: _isBroadcasting ? Colors.blueAccent : Colors.white70,
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 5),
                                      Text(
                                        _isBroadcasting ? 'Passengers are tracking you.' : 'Turn on to let students see your ETA.',
                                        style: const TextStyle(color: Colors.white54, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _isBroadcasting ? Colors.redAccent : Colors.white,
                                    foregroundColor: _isBroadcasting ? Colors.white : Colors.black,
                                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                  ),
                                  onPressed: _toggleBroadcasting,
                                  child: Row(
                                    children: [
                                      Icon(_isBroadcasting ? Icons.stop : Icons.play_arrow, size: 20),
                                      const SizedBox(width: 8),
                                      Text(
                                        _isBroadcasting ? 'STOP SHARING' : 'START LIVE LOCATION',
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
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
}
