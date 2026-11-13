import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/dashboard_layout.dart';
import '../../widgets/frozen_lock.dart';
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
  Map<String, dynamic>? _myFare;
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

  Future<void> _requestSeat(int driverId) async {
    setState(() {
      _isRequesting = true;
    });

    final result = await ApiService.createSeatRequest(driverId, paymentPlan: 'MONTHLY');

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

    setState(() {
      _isRequesting = true;
    });

    final success = await ApiService.deleteSeatRequest(requestId);
    
    if (mounted) {
      setState(() {
        _isRequesting = false;
      });
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Unassigned successfully!', style: TextStyle(color: context.pal.fg)), backgroundColor: Colors.green));
        _fetchData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to unassign', style: TextStyle(color: context.pal.fg)), backgroundColor: Colors.redAccent));
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

    final isNarrow = MediaQuery.of(context).size.width < 900;
    
    final imageWidget = Builder(builder: (context) {
      final busPhotoUrl = ApiService.resolveUrl(bus['busPhotoUrl']);
      return Container(
        decoration: BoxDecoration(
          color: context.pal.fg12,
          image: busPhotoUrl != null
            ? DecorationImage(
                image: NetworkImage(busPhotoUrl),
                fit: BoxFit.cover,
                onError: (_, __) {},
              )
            : null,
        ),
        child: busPhotoUrl == null
          ? Center(child: Icon(Icons.directions_bus, color: context.pal.fg24, size: 40))
          : null,
      );
    });
    
    final detailsWidget = Padding(
      padding: const EdgeInsets.all(20),
      child: isNarrow
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  bus['routeName'] ?? 'Unknown Route',
                  style: TextStyle(color: context.pal.fg, fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 15),
                Wrap(
                  spacing: 20,
                  runSpacing: 10,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.person, color: context.pal.fg54, size: 16),
                        const SizedBox(width: 8),
                        Text('Driver: ${bus['fullName'] ?? 'Unknown'}', style: TextStyle(color: context.pal.fg70)),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.confirmation_number, color: context.pal.fg54, size: 16),
                        const SizedBox(width: 8),
                        Text('Reg: ${bus['busRegNumber'] ?? 'N/A'}', style: TextStyle(color: context.pal.fg70)),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.access_time, color: context.pal.fg54, size: 16),
                        const SizedBox(width: 8),
                        Text(bus['pickupTime'] ?? 'N/A', style: TextStyle(color: context.pal.fg70)),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.event_seat, color: context.pal.fg54, size: 16),
                        const SizedBox(width: 8),
                        Text('Seats: ${bus['busCapacity'] ?? 'N/A'}', style: TextStyle(color: context.pal.fg70)),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.attach_money, color: context.pal.fg54, size: 16),
                        const SizedBox(width: 8),
                        Text(bus['monthlyFee'] != null ? 'LKR ${bus['monthlyFee']}' : 'N/A', style: TextStyle(color: context.pal.fg70)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _isRequesting ? null : (hasRequestedThis ? () => _unassignDriver(requestId!) : (hasActiveRequestAnywhere ? null : () => _requestSeat(bus['id']))),
                  icon: Icon(hasRequestedThis ? Icons.cancel : Icons.send, color: context.pal.fg),
                  label: Text(hasRequestedThis ? 'UNASSIGN' : (hasActiveRequestAnywhere ? 'UNAVAILABLE' : 'REQUEST SEAT'), style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasRequestedThis ? Colors.redAccent : (hasActiveRequestAnywhere ? context.pal.fg24 : Colors.blueAccent),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bus['routeName'] ?? 'Unknown Route',
                        style: TextStyle(color: context.pal.fg, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Icon(Icons.person, color: context.pal.fg54, size: 16),
                          const SizedBox(width: 8),
                          Text('Driver: ${bus['fullName'] ?? 'Unknown'}', style: TextStyle(color: context.pal.fg70)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Icon(Icons.confirmation_number, color: context.pal.fg54, size: 16),
                          const SizedBox(width: 8),
                          Text('Reg: ${bus['busRegNumber'] ?? 'N/A'}', style: TextStyle(color: context.pal.fg70)),
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
                          Icon(Icons.access_time, color: context.pal.fg54, size: 16),
                          const SizedBox(width: 8),
                          Text(bus['pickupTime'] ?? 'N/A', style: TextStyle(color: context.pal.fg70)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Icon(Icons.event_seat, color: context.pal.fg54, size: 16),
                          const SizedBox(width: 8),
                          Text('Seats: ${bus['busCapacity'] ?? 'N/A'}', style: TextStyle(color: context.pal.fg70)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Icon(Icons.attach_money, color: context.pal.fg54, size: 16),
                          const SizedBox(width: 8),
                          Text(bus['monthlyFee'] != null ? 'LKR ${bus['monthlyFee']}' : 'N/A', style: TextStyle(color: context.pal.fg70)),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: _isRequesting ? null : (hasRequestedThis ? () => _unassignDriver(requestId!) : (hasActiveRequestAnywhere ? null : () => _requestSeat(bus['id']))),
                    icon: Icon(hasRequestedThis ? Icons.cancel : Icons.send, color: context.pal.fg),
                    label: Text(hasRequestedThis ? 'UNASSIGN' : (hasActiveRequestAnywhere ? 'UNAVAILABLE' : 'REQUEST SEAT'), style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: hasRequestedThis ? Colors.redAccent : (hasActiveRequestAnywhere ? context.pal.fg24 : Colors.blueAccent),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: context.pal.tint(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.pal.fg24),
      ),
      clipBehavior: Clip.antiAlias,
      child: isNarrow
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 180, child: imageWidget),
                detailsWidget,
              ],
            )
          : IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AspectRatio(aspectRatio: 1, child: imageWidget),
                  Expanded(child: detailsWidget),
                ],
              ),
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

    final profile = _user?['profile'] ?? _user?['student'] ?? {};
    final name = profile['fullName'] ?? 'Student';
    final isNarrow = MediaQuery.of(context).size.width < 900;

    return DashboardLayout(
      userName: name,
      userRole: 'STUDENT',
      activeIndex: 1, // 'AVAILABLE BUSES' index
      child: Padding(
        padding: EdgeInsets.all(isNarrow ? 20.0 : 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AVAILABLE BUSES',
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 40),
            if (_myFare?['frozen'] == true)
              Expanded(
                child: FrozenLock(
                  amountDue: (_myFare?['amountDue'] as num?)?.toDouble() ?? 0,
                  month: _myFare?['month'] ?? '',
                  reason: _myFare?['freezeReason'],
                ),
              )
            else if (_buses.isEmpty)
              Expanded(
                child: Center(
                  child: Text('No buses available at the moment.', style: TextStyle(color: context.pal.fg54, fontSize: 18)),
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
