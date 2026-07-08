import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentPaymentsScreen extends StatefulWidget {
  const StudentPaymentsScreen({Key? key}) : super(key: key);

  @override
  State<StudentPaymentsScreen> createState() => _StudentPaymentsScreenState();
}

class _StudentPaymentsScreenState extends State<StudentPaymentsScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _payments = [];
  List<dynamic> _myRequests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, dynamic>? _myFare;

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final payments = await ApiService.getStudentPayments();
    final requests = await ApiService.getStudentRequests();
    final fare = await ApiService.getMyFare();

    if (mounted) {
      setState(() {
        _user = user;
        _payments = payments;
        _myRequests = requests;
        _myFare = fare;
        _isLoading = false;
      });
    }
  }

  void _showMakePaymentModal() async {
    final fare = _myFare;
    if (fare == null || fare['assigned'] != true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You need an approved bus assignment before you can pay.')),
      );
      return;
    }
    if (fare['status'] == 'PAID') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('You have already paid for ${fare['month']}.')),
      );
      return;
    }
    if (fare['status'] == 'EXEMPT') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No fare is due for ${fare['month']} — your driver marked you as not travelling.')),
      );
      return;
    }

    final month = fare['month'];
    final amount = (fare['amountDue'] as num?)?.toDouble() ?? 0;
    final driverName = fare['driverName'] ?? 'your driver';

    // The server decides the amount and month; this dialog just confirms.
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E2128),
        title: Text('Pay $month Fare', style: const TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Monthly fare to $driverName', style: const TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 12),
            Text('LKR ${amount.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
            onPressed: () async {
              final res = await ApiService.createPayment({
                'referenceNo': 'APP-${DateTime.now().millisecondsSinceEpoch}'
              });
              if (!context.mounted) return;
              if (res['success']) {
                Navigator.pop(context);
                _fetchData();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful!')));
              } else {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'])));
              }
            },
            child: const Text('PAY NOW', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // Status card for the current month: paid / due / overdue-frozen / exempt.
  Widget _buildFareStatusCard() {
    final fare = _myFare;
    if (fare == null || fare['assigned'] != true) return const SizedBox.shrink();

    final status = fare['status'] ?? 'UNPAID';
    final frozen = fare['frozen'] == true;
    final month = fare['month'] ?? '';
    final dueDay = fare['dueDay'] ?? 10;
    final amount = (fare['amountDue'] as num?)?.toDouble() ?? 0;

    Color color;
    IconData icon;
    String title;
    String message;

    if (frozen) {
      color = Colors.redAccent;
      icon = Icons.lock;
      title = 'ACCOUNT FROZEN';
      message = 'Your $month fare (LKR ${amount.toStringAsFixed(2)}) was not paid by the ${dueDay}th. Pay now to unfreeze your account.';
    } else if (status == 'PAID') {
      color = Colors.green;
      icon = Icons.check_circle;
      title = '$month FARE PAID';
      message = 'You are all set for this month. Thank you!';
    } else if (status == 'EXEMPT') {
      color = Colors.white54;
      icon = Icons.event_busy;
      title = 'NOT TRAVELLING THIS MONTH';
      message = 'Your driver marked you as not travelling in $month. No fare is due.';
    } else {
      color = Colors.orange;
      icon = Icons.schedule;
      title = '$month FARE DUE';
      message = 'Pay LKR ${amount.toStringAsFixed(2)} before the ${dueDay}th of the month to avoid your account being frozen.';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 25),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 30),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(message, style: const TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = _user != null ? (_user!['profile'] ?? _user!['student'] ?? {}) : {};
    final hasApprovedDriver = _myRequests.any((r) => r['status'] == 'APPROVED');

    return DashboardLayout(
      userName: profile['fullName'] ?? 'Student',
      userRole: 'STUDENT',
      activeIndex: 4, 
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'PAYMENT HISTORY',
                  style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.payment, size: 18),
                  label: const Text('MAKE PAYMENT', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: _showMakePaymentModal,
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              "TRACK YOUR MONTHLY TRANSPORTATION FEES.",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 25),

            if (!_isLoading) _buildFareStatusCard(),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (!hasApprovedDriver)
              const Center(child: Text("You have to assign to a driver to use this feature.", style: TextStyle(color: Colors.white70, fontSize: 16)))
            else if (_payments.isEmpty)
              const Center(child: Text("No payments made yet.", style: TextStyle(color: Colors.white70)))
            else
              // Payments List
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Row(
                          children: const [
                            Expanded(flex: 2, child: Text('MONTH', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 3, child: Text('DRIVER/BUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('AMOUNT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('METHOD', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          ],
                        ),
                      ),
                      const Divider(color: Colors.white24, height: 1),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _payments.length,
                          itemBuilder: (context, index) {
                            final payment = _payments[index];
                            final driverName = payment['driver']?['fullName'] ?? 'Driver';
                            return Column(
                              children: [
                                _buildPaymentRow(
                                  payment['month'] ?? '-',
                                  driverName,
                                  'LKR ${payment['amount']}',
                                  payment['status'] ?? 'COMPLETED',
                                  payment['paymentMethod'] ?? 'IN_APP',
                                ),
                                if (index < _payments.length - 1)
                                  const Divider(color: Colors.white10, height: 1),
                              ],
                            );
                          }
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

  Widget _buildPaymentRow(String month, String driver, String amount, String status, String method) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        children: [
          Expanded(flex: 2, child: Text(month, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
          Expanded(flex: 3, child: Text(driver, style: const TextStyle(color: Colors.white70))),
          Expanded(flex: 2, child: Text(amount, style: const TextStyle(color: Colors.white))),
          Expanded(
            flex: 2,
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: status == 'COMPLETED' ? Colors.green : Colors.orange,
                  ),
                ),
                const SizedBox(width: 8),
                Text(status, style: TextStyle(color: status == 'COMPLETED' ? Colors.green : Colors.orange, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              ],
            ),
          ),
          Expanded(flex: 2, child: Text(method, style: const TextStyle(color: Colors.white54, fontSize: 12))),
        ],
      ),
    );
  }
}
