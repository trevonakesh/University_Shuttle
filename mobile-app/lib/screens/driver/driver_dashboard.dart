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
  List<dynamic> _dailyRequests = [];
  Map<String, dynamic>? _todayPoll;
  bool _isTodayPoll = false;
  int _totalStudents = 0;
  double _walletBalance = 0.0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.fetchMe();
    final requests = await ApiService.getDriverRequests();
    final wallet = await ApiService.getWalletBalance();
    final polls = await ApiService.getDriverPolls();
    final dailyRequests = await ApiService.getDriverDailyRequests();
    
    // Prefer the poll targeting today's date; otherwise fall back to the
    // most recently created one (and label it as such).
    final now = DateTime.now();
    final today = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    Map<String, dynamic>? todayPoll;
    for (final p in polls) {
      if (p['date'] == today) {
        todayPoll = p;
        break;
      }
    }

    if (mounted) {
      setState(() {
        _user = user;
        _totalStudents = requests.where((r) => r['status'] == 'APPROVED').length;
        _requests = requests.where((r) => r['status'] == 'PENDING').toList();
        _dailyRequests = dailyRequests.where((r) => r['status'] == 'PENDING').toList();
        _walletBalance = wallet;
        _isTodayPoll = todayPoll != null;
        _todayPoll = todayPoll ?? (polls.isNotEmpty ? polls.first : null);
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

  Future<void> _updateDailyRequest(int id, String status) async {
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    
    final result = await ApiService.updateDailyRideStatus(id, status);
    
    if (mounted) Navigator.pop(context);

    if (result['success']) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Daily ride $status successfully!')));
      _fetchData();
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
    }
  }

  void _showComingStudents() {
    if (_todayPoll == null) return;
    final students = ((_todayPoll!['option1Students'] ?? _todayPoll!['comingStudents']) as List<dynamic>?) ?? [];
    final String optionName = (_todayPoll!['option1'] ?? 'Coming').toString();
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1A1A24),
          title: Text('$optionName Students', style: const TextStyle(color: Colors.white)),
          content: SizedBox(
            width: double.maxFinite,
            child: students.isEmpty 
              ? Text('No students have selected $optionName yet.', style: const TextStyle(color: Colors.white70))
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
    int coming = 0;
    int notComing = 0;
    if (_todayPoll != null) {
      coming = (_todayPoll!['stats']?['option1Count'] as num?)?.toInt() ?? (_todayPoll!['stats']?['comingCount'] as num?)?.toInt() ?? 0;
      notComing = (_todayPoll!['stats']?['option2Count'] as num?)?.toInt() ?? (_todayPoll!['stats']?['notComingCount'] as num?)?.toInt() ?? 0;
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

    final isNarrow = MediaQuery.of(context).size.width < 900;
    final statCards = [
      _buildStatCard('TOTAL STUDENTS', _totalStudents.toString(), Icons.school, Colors.white),
      _buildStatCard('SEATS', seats, Icons.event_seat, Colors.white),
      _buildStatCard('WALLET BALANCE', 'LKR ${_walletBalance.toStringAsFixed(2)}', Icons.account_balance_wallet, _walletBalance > 0 ? Colors.greenAccent : Colors.redAccent),
      _buildStatCard('PENDING REQUESTS', _requests.length.toString(), Icons.swap_calls, Colors.white),
    ];

    final header = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'DRIVER DASHBOARD',
          style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
        ),
        const SizedBox(height: 10),
        Text(
          "WELCOME BACK, ${firstName.toUpperCase()}! HERE'S YOUR OVERVIEW",
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ],
    );

    final Widget body;
    if (isNarrow) {
      // Stacked, scrollable layout for phones / narrow windows
      body = SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            header,
            const SizedBox(height: 25),
            for (final card in statCards) ...[card, const SizedBox(height: 15)],
            const SizedBox(height: 15),
            SizedBox(height: 300, child: _buildRequestsPanel()),
            const SizedBox(height: 20),
            SizedBox(height: 300, child: _buildDailyRequestsPanel()),
            const SizedBox(height: 20),
            SizedBox(height: 400, child: _buildPollPanel(coming, notComing, comingPct, notComingPct)),
          ],
        ),
      );
    } else {
      body = Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            header,
            const SizedBox(height: 40),

            // Stats Row
            Row(
              children: [
                for (int i = 0; i < statCards.length; i++) ...[
                  if (i > 0) const SizedBox(width: 20),
                  Expanded(child: statCards[i]),
                ],
              ],
            ),
            const SizedBox(height: 40),

            // Bottom Section (Requests & Poll)
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(flex: 2, child: Column(
                    children: [
                      Expanded(child: _buildRequestsPanel()),
                      const SizedBox(height: 20),
                      Expanded(child: _buildDailyRequestsPanel()),
                    ],
                  )),
                  const SizedBox(width: 20),
                  Expanded(child: _buildPollPanel(coming, notComing, comingPct, notComingPct)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return DashboardLayout(
      userName: name,
      userRole: 'DRIVER',
      activeIndex: 0,
      child: body,
    );
  }

  Widget _buildRequestsPanel() {
    return Container(
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
                const Flexible(
                  child: Text(
                    'PENDING STUDENT REQUESTS',
                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                    overflow: TextOverflow.ellipsis,
                  ),
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
                    return _buildRequestItem(req);
                  },
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildPollPanel(int coming, int notComing, double comingPct, double notComingPct) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(
              _isTodayPoll ? "TODAY'S POLL" : 'LATEST POLL',
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
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
                    _buildPollBar('${(_todayPoll!['option1'] ?? 'COMING').toString().toUpperCase()} ($coming)', Colors.lightGreenAccent, comingPct),
                    const SizedBox(height: 20),
                    _buildPollBar('${(_todayPoll!['option2'] ?? 'NOT COMING').toString().toUpperCase()} ($notComing)', Colors.redAccent, notComingPct),
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

  void _showStudentDetails(Map<String, dynamic> student) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1A1A24),
          title: const Text('STUDENT DETAILS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDetailRow(Icons.person, 'NAME', student['fullName'] ?? 'N/A'),
              const SizedBox(height: 15),
              _buildDetailRow(Icons.school, 'UNIVERSITY', student['universityName'] ?? 'N/A'),
              const SizedBox(height: 15),
              _buildDetailRow(Icons.badge, 'STUDENT ID', student['studentId'] ?? 'N/A'),
              const SizedBox(height: 15),
              _buildDetailRow(Icons.location_on, 'PICKUP', student['pickupPoint'] ?? 'N/A'),
              const SizedBox(height: 15),
              _buildDetailRow(Icons.phone, 'PHONE', student['user']?['phone'] ?? 'N/A'),
            ],
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

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: Colors.white54, size: 20),
        const SizedBox(width: 15),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 14)),
          ],
        ),
      ],
    );
  }

  Widget _buildRequestItem(Map<String, dynamic> req) {
    final reqId = req['id'];
    final student = req['student'] ?? {};
    final name = student['fullName'] ?? 'Unknown';
    final pickup = student['pickupPoint'] ?? 'Unknown';
    final created = (req['createdAt'] ?? '').toString();
    final date = created.length >= 10 ? created.substring(0, 10) : created;

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
              border: Border.all(color: Colors.blueAccent),
              color: Colors.blueAccent.withValues(alpha: 0.2),
            ),
            child: IconButton(
              icon: const Icon(Icons.info_outline, color: Colors.blueAccent),
              onPressed: () => _showStudentDetails(student),
            ),
          ),
          const SizedBox(width: 10),
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
          const SizedBox(width: 10),
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

  Widget _buildDailyRequestsPanel() {
    return Container(
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
                const Flexible(
                  child: Text(
                    'PENDING DAILY RIDES',
                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                    overflow: TextOverflow.ellipsis,
                  ),
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
            child: _dailyRequests.isEmpty
              ? const Center(child: Text('NO PENDING DAILY RIDES', style: TextStyle(color: Colors.white54)))
              : ListView.separated(
                  itemCount: _dailyRequests.length,
                  separatorBuilder: (_, __) => const Divider(color: Colors.white24, height: 1),
                  itemBuilder: (context, index) {
                    final req = _dailyRequests[index];
                    return _buildDailyRequestItem(req);
                  },
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildDailyRequestItem(Map<String, dynamic> req) {
    final reqId = req['id'];
    final student = req['student'] ?? {};
    final name = student['fullName'] ?? 'Unknown';
    final tripType = req['tripType'] == 'ROUND_TRIP' ? 'Round Trip' : (req['tripType'] == 'TO_UNI_ONLY' ? 'To Uni' : 'From Uni');
    final date = req['date'] ?? 'Unknown';
    final fare = req['fareAmount'] != null ? 'LKR ${req['fareAmount']}' : 'TBD';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Colors.white,
            radius: 25,
            child: Icon(Icons.directions_car, color: Colors.black, size: 30),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('DATE: $date | TYPE: $tripType', style: const TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text('FARE: $fare', style: const TextStyle(color: Colors.white54, fontSize: 10)),
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
              onPressed: () => _updateDailyRequest(reqId, 'APPROVED'),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.redAccent),
              color: Colors.redAccent.withValues(alpha: 0.2),
            ),
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.redAccent),
              onPressed: () => _updateDailyRequest(reqId, 'REJECTED'),
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
