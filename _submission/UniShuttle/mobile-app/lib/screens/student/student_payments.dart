import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
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
    // EXEMPT students may still pay: paying reactivates the frozen month.
    final month = fare['month'];
    final amount = (fare['amountDue'] as num?)?.toDouble() ?? 0;
    final driverName = fare['driverName'] ?? 'your driver';

    // The server decides the amount and month; this dialog just confirms.
    // The fare is fixed — there is nothing for the student to edit.
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
            const SizedBox(height: 12),
            const Text(
              'You will be taken to the secure PayHere page to pay with your card.',
              style: TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
            icon: const Icon(Icons.credit_card, size: 18, color: Colors.white),
            onPressed: () async {
              final res = await ApiService.initiatePayment();
              if (!context.mounted) return;
              Navigator.pop(context);
              if (res['success'] != true) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Payment failed')));
                return;
              }
              if (res['mode'] == 'PAYHERE') {
                await _openPayhereCheckout(res['checkoutUrl'], res['paymentId']);
              } else {
                // DIRECT (development fallback): settled instantly.
                _fetchData();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful!')));
              }
            },
            label: const Text('PAY WITH CARD', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // Opens the PayHere hosted card page in the browser, then polls the
  // payment status so the app updates itself once the card is charged.
  Future<void> _openPayhereCheckout(String checkoutUrl, int paymentId) async {
    final launched = await launchUrl(Uri.parse(checkoutUrl), mode: LaunchMode.externalApplication);
    if (!mounted) return;
    if (!launched) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open the payment page.')));
      return;
    }

    Timer? poller;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        poller = Timer.periodic(const Duration(seconds: 4), (t) async {
          final status = await ApiService.getPaymentStatus(paymentId);
          if (!dialogContext.mounted) {
            t.cancel();
            return;
          }
          if (status == 'COMPLETED') {
            t.cancel();
            Navigator.pop(dialogContext);
            _fetchData();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Payment Successful!'), backgroundColor: Colors.green),
            );
          } else if (status == 'FAILED') {
            t.cancel();
            Navigator.pop(dialogContext);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Payment was cancelled or failed. You can retry anytime.'), backgroundColor: Colors.redAccent),
            );
          }
        });
        return AlertDialog(
          backgroundColor: const Color(0xFF1E2128),
          title: const Text('Waiting for payment…', style: TextStyle(color: Colors.white)),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Colors.blueAccent),
              SizedBox(height: 20),
              Text(
                'Complete the card payment in your browser. This screen updates automatically once PayHere confirms it.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                poller?.cancel();
                Navigator.pop(dialogContext);
                _fetchData();
              },
              child: const Text('CLOSE', style: TextStyle(color: Colors.white54)),
            ),
          ],
        );
      },
    ).then((_) => poller?.cancel());
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

    if (frozen && fare['freezeReason'] == 'EXEMPT') {
      color = Colors.redAccent;
      icon = Icons.event_busy;
      title = 'FROZEN — NOT TRAVELLING IN $month';
      message = 'Your driver marked you as not travelling this month, so your account is frozen for $month. It unfreezes automatically next month — or pay LKR ${amount.toStringAsFixed(2)} if you plan to travel.';
    } else if (frozen) {
      color = Colors.redAccent;
      icon = Icons.lock;
      title = 'ACCOUNT FROZEN';
      message = 'Your $month fare (LKR ${amount.toStringAsFixed(2)}) was not paid by the ${dueDay}th. Pay now to unfreeze your account.';
    } else if (status == 'PAID') {
      color = Colors.green;
      icon = Icons.check_circle;
      title = '$month FARE PAID';
      message = 'You are all set for this month. Thank you!';
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
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withValues(alpha: 0.4)),
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
    final isNarrow = MediaQuery.of(context).size.width < 900;

    return DashboardLayout(
      userName: profile['fullName'] ?? 'Student',
      userRole: 'STUDENT',
      activeIndex: 4, 
      child: Padding(
        padding: EdgeInsets.all(isNarrow ? 20.0 : 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            SizedBox(
              width: double.infinity,
              child: Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 20,
                runSpacing: 20,
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
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Column(
                    children: [
                      if (!isNarrow)
                        const Padding(
                          padding: EdgeInsets.all(20.0),
                          child: Row(
                            children: [
                              Expanded(flex: 2, child: Text('MONTH', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 3, child: Text('DRIVER/BUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 2, child: Text('AMOUNT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 2, child: Text('METHOD', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ),
                      if (!isNarrow)
                        const Divider(color: Colors.white24, height: 1),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _payments.length,
                          itemBuilder: (context, index) {
                            final payment = _payments[index];
                            final driverName = payment['driver']?['fullName'] ?? 'Driver';
                            
                            if (isNarrow) {
                              return Container(
                                padding: const EdgeInsets.all(20),
                                decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white10))),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('${payment['month'] ?? '-'}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                        Text('LKR ${payment['amount']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text('Driver: $driverName', style: const TextStyle(color: Colors.white70)),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: payment['status'] == 'COMPLETED' ? Colors.green : Colors.orange)),
                                            const SizedBox(width: 6),
                                            Text(payment['status'] ?? 'COMPLETED', style: TextStyle(color: payment['status'] == 'COMPLETED' ? Colors.green : Colors.orange, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                                          ],
                                        ),
                                        Text(payment['paymentMethod'] ?? 'IN_APP', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            } else {
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
