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
  List<dynamic> _payoutRequests = [];
  bool _isLoading = true;
  late TabController _tabController;
  IO.Socket? _socket;

  late DateTime _selectedMonth;

  // Which fare list is shown: ALL, PAID, UNPAID, or EXEMPT.
  String _filter = 'ALL';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
      _loadPayoutRequests();
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
                      Tab(text: 'WITHDRAWALS'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildFareTracker(isNarrow),
                        _buildHistory(),
                        _buildWithdrawals(),
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

  List<dynamic> get _filteredStudents {
    final students = (_fareData?['students'] as List<dynamic>?) ?? [];
    if (_filter == 'ALL') return students;
    return students.where((s) => (s['status'] ?? 'UNPAID') == _filter).toList();
  }

  String get _emptyListText {
    switch (_filter) {
      case 'PAID':
        return 'NO ONE HAS PAID FOR THIS MONTH YET';
      case 'UNPAID':
        return 'EVERYONE IS SETTLED — NO UNPAID STUDENTS';
      case 'EXEMPT':
        return 'NO STUDENTS MARKED AS NOT TRAVELLING';
      default:
        return 'NO PASSENGERS ASSIGNED YET';
    }
  }

  Widget _buildFareTracker(bool isNarrow) {
    final students = _filteredStudents;
    final summary = _fareData?['summary'] as Map<String, dynamic>?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Month selector + collection totals
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
            if (summary != null && !isNarrow) _buildCollectedText(summary),
          ],
        ),
        if (summary != null && isNarrow) ...[
          _buildCollectedText(summary),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 5),

        // Paid / Unpaid list switcher
        if (summary != null)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('ALL', 'ALL', summary['total'], Colors.white),
                const SizedBox(width: 8),
                _buildFilterChip('PAID', 'PAID', summary['paid'], Colors.green),
                const SizedBox(width: 8),
                _buildFilterChip('UNPAID', 'UNPAID', summary['unpaid'], Colors.redAccent),
                const SizedBox(width: 8),
                _buildFilterChip('EXEMPT', "DIDN'T COME", summary['exempt'], Colors.white54),
              ],
            ),
          ),
        const SizedBox(height: 15),

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
                    ? Center(child: Text(_emptyListText, style: const TextStyle(color: Colors.white54)))
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

  Widget _buildFilterChip(String value, String label, dynamic count, Color color) {
    final isActive = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? color.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? color : Colors.white24),
        ),
        child: Text(
          '$label (${count ?? 0})',
          style: TextStyle(
            color: isActive ? color : Colors.white54,
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  Widget _buildCollectedText(Map<String, dynamic> summary) {
    final collected = (summary['collected'] as num?)?.toDouble() ?? 0;
    final expected = (summary['expected'] as num?)?.toDouble() ?? 0;
    return Text(
      'COLLECTED LKR ${collected.toStringAsFixed(0)} / ${expected.toStringAsFixed(0)}',
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
            final amt = (s['amount'] as num?)?.toDouble() ?? 0;
            final fee10 = (amt * 0.10).toStringAsFixed(2);
            _setStatus(s, 'PAID', 'Record a CASH payment of LKR ${amt.toStringAsFixed(2)} from $name for $_monthLabel? A 10% platform fee (LKR $fee10) will be deducted from your wallet.');
            break;
          case 'EXEMPT':
            _setStatus(s, 'EXEMPT', "Mark $name as not travelling in $_monthLabel? Their account will be FROZEN for this month (unfreezes next month, or when they pay the fare).");
            break;
          case 'UNPAID':
            _setStatus(s, 'UNPAID', 'Set $name back to UNPAID for $_monthLabel?');
            break;
        }
      },
      itemBuilder: (context) => items,
    );
  }

  // ---------- WITHDRAWALS ----------

  Future<void> _loadPayoutRequests() async {
    final data = await ApiService.getMyPayoutRequests();
    if (mounted && data != null) {
      setState(() {
        _payoutRequests = (data['requests'] as List<dynamic>?) ?? [];
        _walletBalance = (data['walletBalance'] as num?)?.toDouble() ?? _walletBalance;
      });
    }
  }

  bool get _hasPendingRequest =>
      _payoutRequests.any((r) => r['status'] == 'PENDING');

  Future<void> _showRequestPayoutDialog() async {
    if (_walletBalance <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You have no earnings available to withdraw yet.')),
      );
      return;
    }
    if (_hasPendingRequest) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You already have a request awaiting admin review.')),
      );
      return;
    }

    final amountController = TextEditingController(text: _walletBalance.toStringAsFixed(2));
    final noteController = TextEditingController();

    await showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1E2128),
        title: const Text('Request Payout', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Available balance: LKR ${_walletBalance.toStringAsFixed(2)}',
              style: const TextStyle(color: Colors.greenAccent, fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Amount to withdraw (LKR)',
                labelStyle: TextStyle(color: Colors.black54),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: noteController,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Note for admin (optional)',
                labelStyle: TextStyle(color: Colors.black54),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'The admin will review your request and transfer the money to your registered bank account.',
              style: TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.greenAccent.shade700),
            onPressed: () async {
              final amount = double.tryParse(amountController.text.trim());
              if (amount == null || amount <= 0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Enter a valid amount.'), backgroundColor: Colors.redAccent),
                );
                return;
              }
              final res = await ApiService.requestPayout(amount, note: noteController.text.trim());
              if (!dialogContext.mounted) return;
              Navigator.pop(dialogContext);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(res['success'] == true
                      ? 'Payout request sent to the admin.'
                      : res['message'] ?? 'Request failed'),
                  backgroundColor: res['success'] == true ? Colors.green : Colors.redAccent,
                ),
              );
              if (res['success'] == true) _loadPayoutRequests();
            },
            child: const Text('SEND REQUEST', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelRequest(Map<String, dynamic> request) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A24),
        title: const Text('Cancel request?', style: TextStyle(color: Colors.white)),
        content: Text(
          'Withdraw your pending request for LKR ${((request['amount'] as num?)?.toDouble() ?? 0).toStringAsFixed(2)}?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('KEEP', style: TextStyle(color: Colors.white54))),
          TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('CANCEL REQUEST', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirm != true) return;

    final res = await ApiService.cancelPayoutRequest(request['id']);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(res['success'] == true ? 'Request cancelled.' : res['message'] ?? 'Failed'),
        backgroundColor: res['success'] == true ? Colors.green : Colors.redAccent,
      ),
    );
    if (res['success'] == true) _loadPayoutRequests();
  }

  Widget _buildWithdrawals() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Available balance + request button
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white24),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('AVAILABLE TO WITHDRAW',
                        style: TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text('LKR ${_walletBalance.toStringAsFixed(2)}',
                        style: TextStyle(
                          color: _walletBalance > 0 ? Colors.greenAccent : Colors.white38,
                          fontSize: 24, fontWeight: FontWeight.bold,
                        )),
                    if (_hasPendingRequest) ...[
                      const SizedBox(height: 6),
                      const Text('A request is awaiting admin review.',
                          style: TextStyle(color: Colors.orangeAccent, fontSize: 11)),
                    ],
                  ],
                ),
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.account_balance, size: 18),
                label: const Text('REQUEST', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: (_walletBalance > 0 && !_hasPendingRequest) ? Colors.white : Colors.white24,
                  foregroundColor: (_walletBalance > 0 && !_hasPendingRequest) ? Colors.black : Colors.white54,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _showRequestPayoutDialog,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white24),
            ),
            child: _payoutRequests.isEmpty
                ? const Center(child: Text('NO WITHDRAWAL REQUESTS YET', style: TextStyle(color: Colors.white54)))
                : ListView.separated(
                    itemCount: _payoutRequests.length,
                    separatorBuilder: (_, __) => const Divider(color: Colors.white10, height: 1),
                    itemBuilder: (context, index) => _buildRequestRow(_payoutRequests[index]),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildRequestRow(Map<String, dynamic> r) {
    final status = r['status'] ?? 'PENDING';
    final amount = (r['amount'] as num?)?.toDouble() ?? 0;
    final created = (r['createdAt'] ?? '').toString();
    final date = created.length >= 10 ? created.substring(0, 10) : created;

    Color color;
    IconData icon;
    switch (status) {
      case 'APPROVED':
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case 'REJECTED':
        color = Colors.redAccent;
        icon = Icons.cancel;
        break;
      default:
        color = Colors.orangeAccent;
        icon = Icons.hourglass_top;
    }

    final payout = r['payout'] as Map<String, dynamic>?;
    final adminNote = r['adminNote'];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('LKR ${amount.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: color.withValues(alpha: 0.5)),
                      ),
                      child: Text(status,
                          style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Requested $date'
                  '${payout?['method'] != null ? ' · paid by ${payout!['method'].toString().replaceAll('_', ' ').toLowerCase()}' : ''}'
                  '${payout?['referenceNo'] != null ? ' · ref ${payout!['referenceNo']}' : ''}',
                  style: const TextStyle(color: Colors.white54, fontSize: 10),
                ),
                if (adminNote != null && adminNote.toString().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text('Admin: $adminNote',
                      style: TextStyle(color: color.withValues(alpha: 0.9), fontSize: 11, fontStyle: FontStyle.italic)),
                ],
              ],
            ),
          ),
          if (status == 'PENDING')
            TextButton(
              onPressed: () => _cancelRequest(r),
              child: const Text('CANCEL', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
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
