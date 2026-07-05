import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({Key? key}) : super(key: key);

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _requests = [];
  Map<String, dynamic>? _todayPoll;
  int _totalStudents = 0;
  double _walletBalance = 0.0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    final requests = await ApiService.getDriverRequests();
    final wallet = await ApiService.getWalletBalance();
    final polls = await ApiService.getDriverPolls();
    
    if (mounted) {
      setState(() {
        _user = user;
        _totalStudents = requests.where((r) => r['status'] == 'APPROVED').length;
        _requests = requests.where((r) => r['status'] == 'PENDING').toList();
        _walletBalance = wallet;
        _todayPoll = polls.isNotEmpty ? polls.first : null;
        _isLoading = false;
      });
    }
  }

  Future<void> _updateRequest(int id, String status) async {
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    
    final result = await ApiService.updateRequestStatus(id, status);
    
    if (mounted) Navigator.pop(context);

    if (result['success']) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Request $status successfully!')));
      _fetchData();
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
    }
  }

  void _showComingStudents() {
    if (_todayPoll == null) return;
    final students = _todayPoll!['comingStudents'] as List<dynamic>? ?? [];
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1A1A24),
          title: const Text('Coming Students', style: TextStyle(color: Colors.white)),
          content: SizedBox(
            width: double.maxFinite,
            child: students.isEmpty 
              ? const Text('No students have marked coming yet.', style: TextStyle(color: Colors.white70))
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: students.length,
                  itemBuilder: (context, index) {
                    final s = students[index];
                    return ListTile(
                      title: Text(s['name'] ?? 'Unknown', style: const TextStyle(color: Colors.white)),
                      subtitle: Text(s['pickupPoint'] ?? 'Unknown', style: const TextStyle(color: Colors.white54)),
                      leading: const CircleAvatar(
                        backgroundColor: Colors.white10,
                        child: Icon(Icons.person, color: Colors.white),
                      ),
                    );
                  },
                ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CLOSE', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      }
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

    int totalPollResponses = 0;
    double comingPct = 0;
    double notComingPct = 0;
    if (_todayPoll != null) {
      final coming = _todayPoll!['stats']['comingCount'] as int;
      final notComing = _todayPoll!['stats']['notComingCount'] as int;
      totalPollResponses = coming + notComing;
      if (totalPollResponses > 0) {
        comingPct = coming / totalPollResponses;
        notComingPct = notComing / totalPollResponses;
      }
    }

    final profile = _user?['profile'] ?? _user?['driver'];
    final name = profile?['fullName'] ?? 'Driver';
    final firstName = name.split(' ').first;
    final seats = profile?['busCapacity']?.toString() ?? '-';

    return DashboardLayout(
      userName: name,
      userRole: 'DRIVER',
      activeIndex: 0,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            const Text(
              'DRIVER DASHBOARD',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 10),
            Text(
              "WELCOME BACK, ${firstName.toUpperCase()}! HERE'S YOUR OVERVIEW",
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
            
            // Stats Row
            Row(
              children: [
                Expanded(child: _buildStatCard('TOTAL STUDENTS', _totalStudents.toString(), Icons.school, Colors.white)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('SEATS', seats, Icons.event_seat, Colors.white)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('WALLET BALANCE', 'LKR ${_walletBalance.toStringAsFixed(2)}', Icons.account_balance_wallet, _walletBalance > 0 ? Colors.greenAccent : Colors.redAccent)),
                const SizedBox(width: 20),
                Expanded(child: _buildStatCard('PENDING REQUESTS', _requests.length.toString(), Icons.swap_calls, Colors.white)),
              ],
            ),
            const SizedBox(height: 40),
            
            // Bottom Section (Requests & Poll)
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Recent Student Requests
                  Expanded(
                    flex: 2,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
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
                                  'PENDING STUDENT REQUESTS',
                                  style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                                ),
                                TextButton(
                                  onPressed: _fetchData,
                                  child: const Text('REFRESH', style: TextStyle(color: Colors.white54, fontSize: 12)),
                                ),
                              ],
                            ),
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          Expanded(
                            child: _requests.isEmpty 
                              ? const Center(child: Text('NO PENDING REQUESTS', style: TextStyle(color: Colors.white54)))
                              : ListView.separated(
                                  itemCount: _requests.length,
                                  separatorBuilder: (_, __) => const Divider(color: Colors.white24, height: 1),
                                  itemBuilder: (context, index) {
                                    final req = _requests[index];
                                    return _buildRequestItem(
                                      req['id'],
                                      req['student']['fullName'],
                                      req['student']['pickupPoint'] ?? 'Unknown',
                                      req['createdAt'].toString().substring(0, 10),
                                    );
                                  },
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  
                  // Today's Poll
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Padding(
                            padding: EdgeInsets.all(20.0),
                            child: Text(
                              "TODAY'S POLL",
                              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          Padding(
                            padding: const EdgeInsets.all(30.0),
                            child: _todayPoll == null 
                              ? const Center(child: Text('NO POLLS AVAILABLE', style: TextStyle(color: Colors.white54)))
                              : Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${_todayPoll!['question']}\n(${_todayPoll!['date']})',
                                      style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.5),
                                    ),
                                    const SizedBox(height: 30),
                                    _buildPollBar('COMING (${_todayPoll!['stats']['comingCount']})', Colors.lightGreenAccent, comingPct),
                                    const SizedBox(height: 20),
                                    _buildPollBar('NOT COMING (${_todayPoll!['stats']['notComingCount']})', Colors.redAccent, notComingPct),
                                  ],
                                ),
                          ),
                          const Spacer(),
                          if (_todayPoll != null)
                            Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.black,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                    side: const BorderSide(color: Colors.white30),
                                  ),
                                  padding: const EdgeInsets.symmetric(vertical: 20),
                                ),
                                onPressed: _showComingStudents,
                                child: const Text('VIEW DETAILS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color valueColor) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white54, size: 40),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1)),
                  const SizedBox(height: 10),
                  Text(value, style: TextStyle(color: valueColor, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRequestItem(int reqId, String name, String pickup, String date) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Colors.white,
            radius: 25,
            child: Icon(Icons.person, color: Colors.black, size: 30),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('PICKUP: $pickup', style: const TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(date, style: const TextStyle(color: Colors.white54, fontSize: 10)),
              ],
            ),
          ),
          
          // Action Buttons
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.green),
              color: Colors.green.withValues(alpha: 0.2),
            ),
            child: IconButton(
              icon: const Icon(Icons.check, color: Colors.green),
              onPressed: () => _updateRequest(reqId, 'APPROVED'),
            ),
          ),
          const SizedBox(width: 15),
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.redAccent),
              color: Colors.redAccent.withValues(alpha: 0.2),
            ),
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.redAccent),
              onPressed: () => _updateRequest(reqId, 'REJECTED'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPollBar(String label, Color color, double percentage) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 10),
        Stack(
          children: [
            Container(
              height: 10,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            FractionallySizedBox(
              widthFactor: percentage,
              child: Container(
                height: 10,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
