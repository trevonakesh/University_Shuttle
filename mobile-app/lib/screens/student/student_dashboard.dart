import 'dart:ui';
import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/dashboard_layout.dart';
import '../../widgets/frozen_lock.dart';
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
  Map<String, dynamic>? _myFare;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.fetchMe();
    final buses = await ApiService.getAvailableBuses();
    final requests = await ApiService.getStudentRequests();
    final fare = await ApiService.getMyFare();

    if (mounted) {
      setState(() {
        _user = user;
        _buses = buses;
        _myRequests = requests;
        _myFare = fare;
        _isLoading = false;
      });
    }
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }

  IconData get _greetingIcon {
    final hour = DateTime.now().hour;
    if (hour < 17) return Icons.wb_sunny_outlined;
    return Icons.nightlight_outlined;
  }

  Future<void> _requestSeat(int driverId) async {
    // Show loading
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    
    final result = await ApiService.createSeatRequest(driverId, paymentPlan: 'MONTHLY');
    
    // Hide loading
    if (mounted) Navigator.pop(context);

    if (result['success']) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Seat requested successfully!')));
      _fetchData(); // Refresh requests
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
    }
  }

  Future<void> _unassignDriver(int requestId) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: context.pal.surface,
          title: Text('Confirm Unassign', style: TextStyle(color: context.pal.fg)),
          content: Text('Are you sure you want to unassign from this bus? You will need to request a seat again if you change your mind.', style: TextStyle(color: context.pal.fg70)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('CANCEL', style: TextStyle(color: context.pal.fg54)),
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

    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    
    final success = await ApiService.deleteSeatRequest(requestId);
    
    if (mounted) Navigator.pop(context);

    if (success) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unassigned successfully!')));
      _fetchData(); // Refresh data
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to unassign')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: context.pal.bg,
        body: Center(child: CircularProgressIndicator(color: context.pal.fg)),
      );
    }

    final profile = _user != null ? (_user!['profile'] ?? _user!['student'] ?? {}) : {};
    final name = profile['fullName'] ?? 'Student';
    final firstName = name.toString().split(' ').first;
    
    // Find active request status
    String status = 'NO REQUEST';
    Color statusColor = Colors.grey;
    bool hasActiveRequestAnywhere = false;
    bool hasApprovedRequest = false;

    for (var req in _myRequests) {
      if (req['status'] == 'PENDING' || req['status'] == 'APPROVED') {
        hasActiveRequestAnywhere = true;
        status = req['status'];
        if (status == 'PENDING') statusColor = Colors.orange;
        if (status == 'APPROVED') {
          statusColor = Colors.green;
          hasApprovedRequest = true;
        }
        break;
      }
    }

    // Payment status for the current month, from the fare ledger
    final fareStatus = _myFare?['status'];
    final isFrozen = _myFare?['frozen'] == true;
    String paymentStatus;
    Color paymentColor;
    if (!hasApprovedRequest || fareStatus == null) {
      paymentStatus = 'N/A';
      paymentColor = Colors.grey;
    } else if (isFrozen) {
      paymentStatus = 'FROZEN';
      paymentColor = Colors.redAccent;
    } else if (fareStatus == 'PAID') {
      paymentStatus = 'PAID';
      paymentColor = Colors.green;
    } else if (fareStatus == 'EXEMPT') {
      paymentStatus = 'EXEMPT';
      paymentColor = context.pal.fg54;
    } else {
      paymentStatus = 'DUE BY 10TH';
      paymentColor = Colors.orange;
    }

    final isNarrow = MediaQuery.of(context).size.width < 900;
    final statCards = [
      _buildStatCard('SEAT STATUS', status, 'Current Booking', Icons.event_seat, statusColor),
      _buildStatCard('PAYMENT STATUS', paymentStatus, 'THIS MONTH', Icons.attach_money, paymentColor),
      _buildStatCard('ACTIVE BUSES', _buses.length.toString(), 'AVAILABLE NOW', Icons.directions_bus, Colors.green),
    ];

    return DashboardLayout(
      userName: name,
      userRole: 'STUDENT',
      activeIndex: 0,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(isNarrow ? 16.0 : 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isFrozen)
              FrozenBanner(
                amountDue: (_myFare?['amountDue'] as num?)?.toDouble() ?? 0,
                month: _myFare?['month'] ?? '',
                reason: _myFare?['freezeReason'],
              ),

            // Welcome Section
            Text(
              'DASHBOARD',
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Flexible(
                  child: Text(
                    '$_greeting, ${firstName.toUpperCase()}! ',
                    style: TextStyle(color: context.pal.fg, fontSize: 16, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(_greetingIcon, color: context.pal.fg70, size: 20),
              ],
            ),
            const SizedBox(height: 5),
            Text(
              "HERE'S WHAT'S HAPPENING WITH YOUR TRAVEL.",
              style: TextStyle(color: context.pal.fg70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 30),

            // Stats: side by side on wide screens, stacked on narrow ones
            if (isNarrow)
              Column(
                children: [
                  for (final card in statCards) ...[card, const SizedBox(height: 15)],
                ],
              )
            else
              Row(
                children: [
                  for (int i = 0; i < statCards.length; i++) ...[
                    if (i > 0) const SizedBox(width: 20),
                    Expanded(child: statCards[i]),
                  ],
                ],
              ),
            const SizedBox(height: 40),

            // Available Buses Near You
            Container(
              decoration: BoxDecoration(
                color: context.pal.tint(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: context.pal.fg24),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'AVAILABLE BUSES',
                          style: TextStyle(color: context.pal.fg, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                        TextButton(
                          onPressed: _fetchData,
                          child: const Text('REFRESH', style: TextStyle(color: Colors.green, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  Divider(color: context.pal.fg24, height: 1),
                  if (_buses.isEmpty)
                    Padding(
                      padding: EdgeInsets.all(40.0),
                      child: Text('NO BUSES AVAILABLE', style: TextStyle(color: context.pal.fg54)),
                    ),
                  ..._buses.map((bus) => Column(
                    children: [
                      _buildBusListItem(
                        bus['id'],
                        bus['routeName'] ?? 'Unknown Route',
                        bus['fullName'] ?? 'Driver',
                        'LKR ${bus['monthlyFee'] ?? '0'}',
                        hasActiveRequestAnywhere
                      ),
                      Divider(color: context.pal.fg24, height: 1),
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
            color: context.pal.tint(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.pal.tint(0.2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: context.pal.fg54, size: 30),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: context.pal.fg, fontSize: 10, letterSpacing: 1)),
                    const SizedBox(height: 5),
                    Text(value, style: TextStyle(color: statusColor, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 5),
                    Text(subtitle, style: TextStyle(color: context.pal.fg54, fontSize: 10)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBusListItem(int driverId, String route, String driver, String price, bool hasActiveRequestAnywhere) {
    int? requestId;
    bool hasRequestedThis = false;
    for (var req in _myRequests) {
      if (req['driverId'] == driverId && (req['status'] == 'PENDING' || req['status'] == 'APPROVED')) {
        hasRequestedThis = true;
        requestId = req['id'];
        break;
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      child: Row(
        children: [
          // Bus Icon/Thumbnail
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: context.pal.fg12,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.directions_bus, color: context.pal.fg, size: 24),
          ),
          const SizedBox(width: 20),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(route, style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('DRIVER: $driver', style: TextStyle(color: context.pal.fg54, fontSize: 10)),
                const SizedBox(height: 4),
                Text('$price / MONTH', style: TextStyle(color: context.pal.fg70, fontSize: 12)),
              ],
            ),
          ),
          
          const SizedBox(width: 10),

          // Button
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: hasRequestedThis ? Colors.redAccent : (hasActiveRequestAnywhere ? context.pal.fg24 : context.pal.fg),
              foregroundColor: hasRequestedThis ? context.pal.fg : context.pal.onFg,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20),
            ),
            onPressed: hasRequestedThis ? () => _unassignDriver(requestId!) : (hasActiveRequestAnywhere ? null : () => _requestSeat(driverId)),
            child: Text(hasRequestedThis ? 'UNASSIGN' : (hasActiveRequestAnywhere ? 'UNAVAILABLE' : 'REQUEST SEAT'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10)),
          ),
        ],
      ),
    );
  }
}
