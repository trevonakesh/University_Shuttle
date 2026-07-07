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

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final payments = await ApiService.getStudentPayments();
    final requests = await ApiService.getStudentRequests();
    
    if (mounted) {
      setState(() {
        _user = user;
        _payments = payments;
        _myRequests = requests;
        _isLoading = false;
      });
    }
  }

  void _showMakePaymentModal() async {
    // Attempt to get actual driver ID from student requests
    String? driverId;
    if (_myRequests.isNotEmpty && _myRequests.any((r) => r['status'] == 'APPROVED')) {
      final approvedReq = _myRequests.firstWhere((r) => r['status'] == 'APPROVED');
      driverId = approvedReq['driverId'].toString();
    } else {
      final buses = await ApiService.getAvailableBuses();
      if (buses.isNotEmpty) {
        driverId = buses[0]['id'].toString();
      }
    }

    if (driverId == null) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No assigned driver found')));
      return;
    }

    final amountController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E2128),
        title: const Text('Make a Payment', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Amount (LKR)',
                labelStyle: TextStyle(color: Colors.black54),
                filled: true,
                fillColor: Colors.white,
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
              ),
            ),
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
              if (amountController.text.isNotEmpty) {
                final amount = double.tryParse(amountController.text);
                if (amount != null) {
                  final res = await ApiService.createPayment({
                    'driverId': int.parse(driverId!),
                    'amount': amount,
                    'month': '2026-06',
                    'paymentMethod': 'IN_APP',
                    'referenceNo': 'APP-${DateTime.now().millisecondsSinceEpoch}'
                  });
                  if (res['success']) {
                    Navigator.pop(context);
                    _fetchData();
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful!')));
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'])));
                  }
                }
              }
            },
            child: const Text('PAY NOW', style: TextStyle(color: Colors.white)),
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
            const SizedBox(height: 40),

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
