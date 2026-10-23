import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
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
  final MapController _mapController = MapController();

  // Default view before the first GPS fix (Colombo)
  LatLng _currentLocation = const LatLng(6.9271, 79.8612);
  bool _hasFix = false;
  double _speedKmh = 0;
  DateTime? _lastSentAt;
  StreamSubscription<Position>? _positionSub;

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
    _socket = await ApiService.createSocket();
    if (!mounted) {
      _socket!.dispose();
      return;
    }

    _socket!.connect();

    _socket!.onConnect((_) {
      if (_user != null && _user!['profile'] != null) {
        _socket!.emit('joinDriverRoom', _user!['profile']['id'].toString());
      }
    });
  }

  String? get _driverId => _user?['profile']?['id']?.toString();

  // Asks for permission and returns true when we can read the device GPS.
  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showError('Location services are turned off on this device. Enable GPS and try again.');
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      _showError('Location permission denied. Allow location access to share your position with passengers.');
      return false;
    }
    return true;
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
    );
  }

  Future<void> _toggleBroadcasting() async {
    if (_isBroadcasting) {
      _stopBroadcasting();
      return;
    }

    if (!await _ensureLocationPermission()) return;

    try {
      // Immediate first fix so the map jumps to the real position right away.
      final first = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _onPosition(first);
    } catch (e) {
      _showError('Could not read GPS position: $e');
      return;
    }

    // Continuous updates: every 10 metres of movement (or ~5s on platforms
    // that use time-based throttling).
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen(_onPosition, onError: (e) {
      _showError('GPS error: $e');
      _stopBroadcasting();
    });

    setState(() => _isBroadcasting = true);
  }

  void _onPosition(Position position) {
    final point = LatLng(position.latitude, position.longitude);
    setState(() {
      _currentLocation = point;
      _hasFix = true;
      _speedKmh = position.speed > 0 ? position.speed * 3.6 : 0;
    });
    try {
      _mapController.move(point, 16);
    } catch (_) {}

    // Throttle network sends to at most one per 2 seconds.
    final now = DateTime.now();
    if (_lastSentAt != null && now.difference(_lastSentAt!).inMilliseconds < 2000) return;
    _lastSentAt = now;

    final driverId = _driverId;
    if (driverId != null && _socket != null && _socket!.connected) {
      _socket!.emit('updateLocation', {
        'driverId': driverId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'speed': position.speed, // m/s
        'heading': position.heading,
        'timestamp': now.toUtc().toIso8601String(),
      });
    }
  }

  void _stopBroadcasting() {
    _positionSub?.cancel();
    _positionSub = null;
    final driverId = _driverId;
    if (driverId != null && _socket != null && _socket!.connected) {
      _socket!.emit('stopBroadcast', driverId);
    }
    if (mounted) setState(() => _isBroadcasting = false);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _positionSub?.cancel();
    if (_isBroadcasting) {
      final driverId = _driverId;
      if (driverId != null && _socket != null && _socket!.connected) {
        _socket!.emit('stopBroadcast', driverId);
      }
    }
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = _user != null ? (_user!['profile'] ?? _user!['driver'] ?? {}) : {};
    final isNarrow = MediaQuery.of(context).size.width < 900;
    return DashboardLayout(
      userName: profile['fullName'] ?? 'Driver',
      userRole: 'DRIVER',
      activeIndex: 4,
      child: Padding(
        padding: EdgeInsets.all(isNarrow ? 16.0 : 40.0),
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
              "BROADCAST YOUR REAL LOCATION TO YOUR PASSENGERS",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 25),

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
                        mapController: _mapController,
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
                                            color: Colors.blueAccent.withValues(alpha: 0.2 - (_pulseController.value * 0.1)),
                                            border: Border.all(
                                              color: Colors.blueAccent.withValues(alpha: 0.5 - (_pulseController.value * 0.3)),
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
                      bottom: isNarrow ? 15 : 30,
                      left: isNarrow ? 15 : 30,
                      right: isNarrow ? 15 : 30,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            padding: EdgeInsets.all(isNarrow ? 15 : 25),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.6),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Wrap(
                              spacing: 15,
                              runSpacing: 15,
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
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
                                      _isBroadcasting
                                        ? (_hasFix
                                            ? 'GPS live · ${_speedKmh.toStringAsFixed(0)} km/h · ${_currentLocation.latitude.toStringAsFixed(5)}, ${_currentLocation.longitude.toStringAsFixed(5)}'
                                            : 'Waiting for GPS fix…')
                                        : 'Turn on to share your real GPS position with students.',
                                      style: const TextStyle(color: Colors.white54, fontSize: 13),
                                    ),
                                  ],
                                ),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _isBroadcasting ? Colors.redAccent : Colors.white,
                                    foregroundColor: _isBroadcasting ? Colors.white : Colors.black,
                                    padding: EdgeInsets.symmetric(horizontal: isNarrow ? 20 : 30, vertical: isNarrow ? 15 : 20),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                  ),
                                  onPressed: _toggleBroadcasting,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
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
