import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverPaymentsScreen extends StatefulWidget {
  const DriverPaymentsScreen({Key? key}) : super(key: key);

  @override
  State<DriverPaymentsScreen> createState() => _DriverPaymentsScreenState();
}

class _DriverPaymentsScreenState extends State<DriverPaymentsScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _fareData;
  List<dynamic> _payments = [];
  double _walletBalance = 0.0;
  bool _isLoading = true;
  late TabController _tabController;
  IO.Socket? _socket;

  late DateTime _selectedMonth;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    final now = DateTime.now();
    _selectedMonth = DateTime(now.year, now.month);
    _fetchData();
  }

  String get _monthKey =>
      '${_selectedMonth.year}-${_selectedMonth.month.toString().padLeft(2, '0')}';

  String get _monthLabel {
    const names = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return '${names[_selectedMonth.month - 1]} ${_selectedMonth.year}';
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    final fares = await ApiService.getDriverFares(month: _monthKey);
    final payments = await ApiService.getDriverPayments();
    final balance = await ApiService.getWalletBalance();

    if (mounted) {
      setState(() {
        _user = user;
        _fareData = fares;
        _payments = payments;
        _walletBalance = balance;
        _isLoading = false;
      });
      _connectSocket();
    }
  }

  Future<void> _fetchFares() async {
    final fares = await ApiService.getDriverFares(month: _monthKey);
    if (mounted) setState(() => _fareData = fares);
  }

  void _connectSocket() {
    if (_socket != null) return;
    final profile = _user?['profile'] ?? _user?['driver'];
    final driverId = profile?['id'];
    if (driverId == null) return;

    final baseUrl = ApiService.baseUrl.replaceAll('/api', '');
    _socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    _socket!.connect();
    _socket!.onConnect((_) {
      _socket!.emit('joinStatusRoom', driverId.toString());
    });
    // A student paid in-app: refresh the ledger live.
    _socket!.on('fareUpdated', (_) {
      if (mounted) {
        _fetchFares();
        ApiService.getDriverPayments().then((p) {
          if (mounted) setState(() => _payments = p);
        });
        ApiService.getWalletBalance().then((b) {
          if (mounted) setState(() => _walletBalance = b);
        });
      }
    });
  }

  void _changeMonth(int delta) {
    setState(() {
      _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month + delta);
      _fareData = null;
    });
    _fetchFares();
  }

  Future<void> _setStatus(Map<String, dynamic> student, String status, String confirmText) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A24),
        title: const Text('Confirm', style: TextStyle(color: Colors.white)),
        content: Text(confirmText, style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('CONFIRM', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    final res = await ApiService.setFareStatus(student['studentId'], _monthKey, status);
    if (!mounted) return;
    if (res['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${student['fullName']} marked as $status'), backgroundColor: Colors.green),
      );
      _fetchData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message']), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
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
      activeIndex: 3,
      child: Padding(
        padding: EdgeInsets.all(isNarrow ? 16.0 : 40.0),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Colors.white))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(isNarrow),
                  const SizedBox(height: 20),
                  TabBar(
                    controller: _tabController,
                    indicatorColor: Colors.white,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white54,
                    labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                    tabs: const [
                      Tab(text: 'FARE TRACKER'),
                      Tab(text: 'PAYMENT HISTORY'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildFareTracker(isNarrow),
                        _buildHistory(),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildHeader(bool isNarrow) {
    final wallet = Container(
      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.account_balance_wallet, color: Colors.green, size: 28),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('WALLET BALANCE', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 3),
              Text('LKR ${_walletBalance.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );

    final title = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        Text(
          'MONTHLY FARES',
          style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
        ),
        SizedBox(height: 5),
        Text(
          "TRACK WHO PAID, WHO DIDN'T, AND WHO ISN'T TRAVELLING",
          style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
        ),
      ],
    );

    if (isNarrow) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [title, const SizedBox(height: 15), wallet],
      );
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [title, wallet],
    );
  }

  // ---------- FARE TRACKER ----------

  Widget _buildFareTracker(bool isNarrow) {
    final students = (_fareData?['students'] as List<dynamic>?) ?? [];
    final summary = _fareData?['summary'] as Map<String, dynamic>?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Month selector + summary
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left, color: Colors.white),
              onPressed: () => _changeMonth(-1),
            ),
            Text(_monthLabel, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
            IconButton(
              icon: const Icon(Icons.chevron_right, color: Colors.white),
              onPressed: () => _changeMonth(1),
            ),
            const Spacer(),
            if (summary != null && !isNarrow) _buildSummaryText(summary),
          ],
        ),
        if (summary != null && isNarrow) ...[
          _buildSummaryText(summary),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 10),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white24),
            ),
            child: _fareData == null
                ? const Center(child: CircularProgressIndicator(color: Colors.white))
                : students.isEmpty
                    ? const Center(child: Text('NO PASSENGERS ASSIGNED YET', style: TextStyle(color: Colors.white54)))
                    : ListView.separated(
                        itemCount: students.length,
                        separatorBuilder: (_, __) => const Divider(color: Colors.white10, height: 1),
                        itemBuilder: (context, index) => _buildStudentRow(students[index]),
                      ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryText(Map<String, dynamic> summary) {
    final collected = (summary['collected'] as num?)?.toDouble() ?? 0;
    final expected = (summary['expected'] as num?)?.toDouble() ?? 0;
    return Text(
      'PAID ${summary['paid']} · UNPAID ${summary['unpaid']} · EXEMPT ${summary['exempt']}   |   LKR ${collected.toStringAsFixed(0)} / ${expected.toStringAsFixed(0)}',
      style: const TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
    );
  }

  Widget _buildStudentRow(Map<String, dynamic> s) {
    final status = s['status'] ?? 'UNPAID';
    final frozen = s['frozen'] == true;
    final method = s['paymentMethod'];

    Color chipColor;
    String chipText;
    switch (status) {
      case 'PAID':
        chipColor = Colors.green;
        chipText = method == 'CASH' ? 'PAID · CASH' : 'PAID · APP';
        break;
      case 'EXEMPT':
        chipColor = Colors.white54;
        chipText = "DIDN'T COME";
        break;
      default:
        chipColor = Colors.redAccent;
        chipText = 'UNPAID';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Colors.white24,
            radius: 18,
            child: Icon(Icons.person, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s['fullName'] ?? 'Student', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 3),
                Text(
                  '${s['pickupPoint'] ?? '-'}${s['phone'] != null ? ' · ${s['phone']}' : ''}',
                  style: const TextStyle(color: Colors.white54, fontSize: 10),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (frozen) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('FROZEN', style: TextStyle(color: Colors.lightBlueAccent, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
            ),
            const SizedBox(width: 8),
          ],
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: chipColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: chipColor.withValues(alpha: 0.5)),
            ),
            child: Text(chipText, style: TextStyle(color: chipColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
          ),
          _buildActionsMenu(s, status, method),
        ],
      ),
    );
  }

  Widget _buildActionsMenu(Map<String, dynamic> s, String status, String? method) {
    final name = s['fullName'] ?? 'this student';
    const itemStyle = TextStyle(color: Colors.white, fontSize: 13);
    final items = <PopupMenuItem<String>>[];

    if (status == 'UNPAID') {
      items.add(const PopupMenuItem(value: 'PAID', child: Text('Mark Paid (Cash)', style: itemStyle)));
      items.add(const PopupMenuItem(value: 'EXEMPT', child: Text("Mark Didn't Come", style: itemStyle)));
    } else if (status == 'EXEMPT') {
      items.add(const PopupMenuItem(value: 'UNPAID', child: Text('Undo (back to Unpaid)', style: itemStyle)));
    } else if (status == 'PAID' && method == 'CASH') {
      items.add(const PopupMenuItem(value: 'UNPAID', child: Text('Undo Cash Payment', style: itemStyle)));
    }

    if (items.isEmpty) {
      // In-app payments cannot be undone by the driver.
      return const SizedBox(width: 40);
    }

    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, color: Colors.white54),
      color: const Color(0xFF1A1A24),
      onSelected: (value) {
        switch (value) {
          case 'PAID':
            _setStatus(s, 'PAID', 'Record a CASH payment of LKR ${(s['amount'] as num?)?.toStringAsFixed(2) ?? '-'} from $name for $_monthLabel?');
            break;
          case 'EXEMPT':
            _setStatus(s, 'EXEMPT', "Mark $name as not travelling in $_monthLabel? No fare will be due and their account won't be frozen.");
            break;
          case 'UNPAID':
            _setStatus(s, 'UNPAID', 'Set $name back to UNPAID for $_monthLabel?');
            break;
        }
      },
      itemBuilder: (context) => items,
    );
  }

  // ---------- PAYMENT HISTORY ----------

  Widget _buildHistory() {
    if (_payments.isEmpty) {
      return const Center(child: Text('No payments received yet.', style: TextStyle(color: Colors.white70)));
    }
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: ListView.separated(
        itemCount: _payments.length,
        separatorBuilder: (_, __) => const Divider(color: Colors.white10, height: 1),
        itemBuilder: (context, index) {
          final payment = _payments[index];
          final studentName = payment['student']?['fullName'] ?? 'Student';
          final totalAmount = (payment['amount'] as num?)?.toDouble() ?? 0;
          final commission = (payment['adminCommission'] as num?)?.toDouble() ?? 0;
          final netEarned = totalAmount - commission;
          final isCash = payment['paymentMethod'] == 'CASH';

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.white24,
                  radius: 16,
                  child: Icon(isCash ? Icons.payments : Icons.phone_android, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(studentName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 3),
                      Text(
                        '${payment['month'] ?? '-'} · ${isCash ? 'CASH' : 'IN-APP'}${commission > 0 ? ' · fee LKR ${commission.toStringAsFixed(0)}' : ''}',
                        style: const TextStyle(color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                Text(
                  'LKR ${netEarned.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
