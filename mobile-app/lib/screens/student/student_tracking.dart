import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../widgets/dashboard_layout.dart';
import '../../widgets/frozen_lock.dart';
import '../../services/api_service.dart';

import '../../utils/lang.dart';
class StudentTrackingScreen extends StatefulWidget {
  const StudentTrackingScreen({Key? key}) : super(key: key);

  @override
  State<StudentTrackingScreen> createState() => _StudentTrackingScreenState();
}

class _StudentTrackingScreenState extends State<StudentTrackingScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _myRequests = [];
  Map<String, dynamic>? _myFare;
  IO.Socket? _socket;
  final MapController _mapController = MapController();

  // Default view before the first update (Colombo)
  LatLng _busLocation = const LatLng(6.9271, 79.8612);
  bool _isBusOnline = false;
  double? _busSpeedKmh;
  DateTime? _lastUpdate;
  Timer? _staleTimer;

  // Student's own position (optional — used for distance/ETA)
  LatLng? _myLocation;

  String? _driverIdToTrack;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initUserAndSocket();
    // If no update arrives for 30s, show the bus as offline.
    _staleTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (_isBusOnline && _lastUpdate != null && DateTime.now().difference(_lastUpdate!).inSeconds > 30) {
        if (mounted) setState(() => _isBusOnline = false);
      } else if (mounted) {
        setState(() {}); // refresh the "x seconds ago" label
      }
    });
  }

  Future<void> _initUserAndSocket() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final requests = await ApiService.getStudentRequests();
    final fare = await ApiService.getMyFare();

    setState(() {
      _user = user;
      _myRequests = requests;
      _myFare = fare;
    });

    // Only track the driver the student is actually assigned to.
    if (requests.any((r) => r['status'] == 'APPROVED')) {
      final approvedReq = requests.firstWhere((r) => r['status'] == 'APPROVED');
      _driverIdToTrack = approvedReq['driverId'].toString();
    }

    // Connect to Socket.IO only when there is a bus to track.
    if (_driverIdToTrack != null) {
      _socket = await ApiService.createSocket();
      if (!mounted) {
        _socket!.dispose();
        return;
      }

      _socket!.connect();

      _socket!.onConnect((_) {
        _socket!.emit('joinStudentRoom', _driverIdToTrack);
      });

      _socket!.on('busLocationUpdate', (data) {
        if (!mounted) return;
        final lat = (data['latitude'] as num?)?.toDouble();
        final lng = (data['longitude'] as num?)?.toDouble();
        if (lat == null || lng == null) return;
        final speed = (data['speed'] as num?)?.toDouble();
        setState(() {
          _isBusOnline = true;
          _busLocation = LatLng(lat, lng);
          _busSpeedKmh = (speed != null && speed > 0) ? speed * 3.6 : null;
          _lastUpdate = DateTime.now();
        });
        try {
          _mapController.move(_busLocation, 15);
        } catch (_) {}
      });

      _socket!.on('busOffline', (_) {
        if (mounted) setState(() => _isBusOnline = false);
      });

      _fetchMyLocation();
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  // Best-effort: used only to compute distance/ETA. Silently skipped when
  // the student declines permission.
  Future<void> _fetchMyLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      if (mounted) setState(() => _myLocation = LatLng(pos.latitude, pos.longitude));
    } catch (_) {
      // distance/ETA simply stay unavailable
    }
  }

  double? get _distanceKm {
    if (_myLocation == null || !_isBusOnline) return null;
    final metres = Geolocator.distanceBetween(
      _myLocation!.latitude, _myLocation!.longitude,
      _busLocation.latitude, _busLocation.longitude,
    );
    return metres / 1000;
  }

  String get _etaText {
    final dist = _distanceKm;
    if (dist == null) return '--';
    // Use the bus's live speed when it's actually moving; otherwise assume
    // typical Sri Lankan urban traffic (~25 km/h).
    final speed = (_busSpeedKmh != null && _busSpeedKmh! > 5) ? _busSpeedKmh! : 25.0;
    final mins = (dist / speed * 60).round();
    if (mins < 1) return tr('ARRIVING');
    return tr(mins == 1 ? '{n} MIN' : '{n} MINS', {'n': mins});
  }

  String get _lastSeenText {
    if (_lastUpdate == null) return 'Waiting for the bus to come online…';
    final secs = DateTime.now().difference(_lastUpdate!).inSeconds;
    if (secs < 5) return 'Live · updated just now';
    if (secs < 60) return tr('Live · updated {n}s ago', {'n': secs});
    return tr('Last seen {n} min ago', {'n': (secs / 60).floor()});
  }

  @override
  void dispose() {
    _staleTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = _user != null ? (_user!['profile'] ?? _user!['student'] ?? {}) : {};
    final hasApprovedDriver = _myRequests.any((r) => r['status'] == 'APPROVED');
    final isNarrow = MediaQuery.of(context).size.width < 900;
    final dist = _distanceKm;

    return DashboardLayout(
      userName: profile['fullName'] ?? 'Student',
      userRole: 'STUDENT',
      activeIndex: 5,
      child: Padding(
        padding: EdgeInsets.all(isNarrow ? 16.0 : 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              tr('LIVE BUS TRACKING'),
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            Text(
              tr("TRACK YOUR BUS IN REAL-TIME AND VIEW ETA"),
              style: TextStyle(color: context.pal.fg70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 25),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_myFare?['frozen'] == true)
              Expanded(
                child: FrozenLock(
                  amountDue: (_myFare?['amountDue'] as num?)?.toDouble() ?? 0,
                  month: _myFare?['month'] ?? '',
                  reason: _myFare?['freezeReason'],
                ),
              )
            else if (!hasApprovedDriver)
              Center(child: Text(tr("You have to assign to a driver to use this feature."), style: TextStyle(color: context.pal.fg70, fontSize: 16)))
            else
              // Map and Info Area
              Expanded(
                child: Container(
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: context.pal.fg24, width: 1),
                ),
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: FlutterMap(
                        mapController: _mapController,
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
                              if (_myLocation != null)
                                Marker(
                                  point: _myLocation!,
                                  width: 30,
                                  height: 30,
                                  child: Icon(Icons.person_pin_circle, color: context.pal.green, size: 30),
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
                              color: Colors.black.withValues(alpha: 0.6),
                              border: Border.all(color: context.pal.fg24),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: context.pal.fg12,
                                      radius: 20,
                                      child: Icon(Icons.directions_bus, color: context.pal.fg, size: 20),
                                    ),
                                    const SizedBox(width: 15),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(tr('Status'), style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold)),
                                          Text(
                                            tr(_isBusOnline ? _lastSeenText : 'Offline'),
                                            style: TextStyle(color: _isBusOnline ? Colors.green : Colors.red, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 25),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildEtaStat('ETA', _isBusOnline ? _etaText : '--', Colors.blueAccent),
                                    _buildEtaStat('DISTANCE', (dist != null) ? '${dist.toStringAsFixed(1)} KM' : '--', Colors.green),
                                    _buildEtaStat('SPEED', (_isBusOnline && _busSpeedKmh != null) ? '${_busSpeedKmh!.toStringAsFixed(0)} KM/H' : '--', Colors.orange),
                                  ],
                                ),
                                if (_myLocation == null && _isBusOnline) ...[
                                  const SizedBox(height: 12),
                                  Text(
                                    tr('Allow location access to see distance and ETA to you.'),
                                    style: TextStyle(color: context.pal.fg38, fontSize: 10),
                                  ),
                                ],
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
        Text(tr(label), style: TextStyle(color: context.pal.fg54, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
        const SizedBox(height: 5),
        Text(tr(value), style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
