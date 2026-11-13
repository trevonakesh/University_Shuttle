import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import '../../utils/palette.dart';
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
  List<dynamic> _dailyRequests = [];
  bool _isLoading = true;
  bool _isDailyView = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, dynamic>? _myFare;

  bool get _onlinePayments => _myFare?['onlinePayments'] == true;
  bool get _dailyRidePayments => _myFare?['dailyRidePayments'] == true;

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final payments = await ApiService.getStudentPayments();
    final requests = await ApiService.getStudentRequests();
    final fare = await ApiService.getMyFare();
    final dailyRequests = await ApiService.getStudentDailyRequests();

    if (mounted) {
      setState(() {
        _user = user;
        _payments = payments;
        _myRequests = requests;
        _dailyRequests = dailyRequests;
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
        backgroundColor: context.pal.surface,
        title: Text('Pay $month Fare', style: TextStyle(color: context.pal.fg)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Monthly fare to $driverName', style: TextStyle(color: context.pal.fg70, fontSize: 13)),
            const SizedBox(height: 12),
            Text('LKR ${amount.toStringAsFixed(2)}', style: TextStyle(color: context.pal.fg, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(
              'You will be taken to the secure PayHere page to pay with your card.',
              style: TextStyle(color: context.pal.fg54, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('CANCEL', style: TextStyle(color: context.pal.fg54)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
            icon: Icon(Icons.credit_card, size: 18, color: context.pal.fg),
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
            label: Text('PAY WITH CARD', style: TextStyle(color: context.pal.fg)),
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
          backgroundColor: context.pal.surface,
          title: Text('Waiting for payment…', style: TextStyle(color: context.pal.fg)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Colors.blueAccent),
              SizedBox(height: 20),
              Text(
                'Complete the card payment in your browser. This screen updates automatically once PayHere confirms it.',
                style: TextStyle(color: context.pal.fg70, fontSize: 12),
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
              child: Text('CLOSE', style: TextStyle(color: context.pal.fg54)),
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
      message = 'Your driver marked you as not travelling this month, so your account is frozen for $month. It unfreezes automatically next month — or ${_onlinePayments ? 'pay' : 'hand your driver'} LKR ${amount.toStringAsFixed(2)} if you plan to travel.';
    } else if (frozen) {
      color = Colors.redAccent;
      icon = Icons.lock;
      title = 'ACCOUNT FROZEN';
      message = 'Your $month fare (LKR ${amount.toStringAsFixed(2)}) was not paid by the ${dueDay}th. ${_onlinePayments ? 'Pay now to unfreeze your account.' : 'Hand it to your driver and ask them to mark it as paid to unfreeze your account.'}';
    } else if (status == 'PAID') {
      color = Colors.green;
      icon = Icons.check_circle;
      title = '$month FARE PAID';
      message = 'You are all set for this month. Thank you!';
    } else {
      color = Colors.orange;
      icon = Icons.schedule;
      title = '$month FARE DUE';
      message = _onlinePayments
          ? 'Pay LKR ${amount.toStringAsFixed(2)} before the ${dueDay}th of the month to avoid your account being frozen.'
          : 'Hand LKR ${amount.toStringAsFixed(2)} to your driver before the ${dueDay}th of the month. Online payments are coming soon.';
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
                Text(message, style: TextStyle(color: context.pal.fg70, fontSize: 12)),
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
    final activeRequest = _myRequests.firstWhere((r) => r['status'] == 'APPROVED', orElse: () => null);
    final isNarrow = MediaQuery.of(context).size.width < 900;
    
    // Check if the current month is paid
    final isMonthlyPaid = _myFare != null && _myFare!['status'] == 'PAID';

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
                  Text(
                    'PAYMENTS',
                    style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: !_isDailyView ? Colors.blueAccent : context.pal.fg12,
                          foregroundColor: !_isDailyView ? Colors.white : context.pal.fg,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.horizontal(left: Radius.circular(20))),
                        ),
                        onPressed: () => setState(() => _isDailyView = false),
                        child: const Text('MONTHLY PLAN'),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isDailyView ? context.pal.green : context.pal.fg12,
                          foregroundColor: _isDailyView ? context.pal.onFg : context.pal.fg,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.horizontal(right: Radius.circular(20))),
                        ),
                        onPressed: () => setState(() => _isDailyView = true),
                        child: const Text('DAILY PLAN'),
                      ),
                    ],
                  )
                ],
              ),
            ),
            const SizedBox(height: 10),
            Text(
              _isDailyView
                  ? (_dailyRidePayments ? "REQUEST AND PAY FOR SPECIFIC DAYS OF TRAVEL." : "REQUEST SPECIFIC DAYS OF TRAVEL. PAY YOUR DRIVER IN CASH.")
                  : "TRACK YOUR MONTHLY TRANSPORTATION FEES.",
              style: TextStyle(color: context.pal.fg70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 20),

            // Top actions
            if (hasApprovedDriver)
              Row(
                children: [
                  if (!_isDailyView)
                    ElevatedButton.icon(
                      icon: const Icon(Icons.payment, size: 18),
                      label: Text(_onlinePayments ? 'MAKE MONTHLY PAYMENT' : 'ONLINE PAYMENTS COMING SOON', style: const TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.pal.fg,
                        foregroundColor: context.pal.onFg,
                        disabledBackgroundColor: context.pal.fg12,
                        disabledForegroundColor: context.pal.fg54,
                        padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      onPressed: _onlinePayments ? _showMakePaymentModal : null,
                    )
                  else
                    ElevatedButton.icon(
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('REQUEST DAILY RIDE', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isMonthlyPaid ? Colors.grey : context.pal.green,
                        foregroundColor: isMonthlyPaid ? context.pal.fg54 : context.pal.onFg,
                        padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      onPressed: isMonthlyPaid 
                        ? () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You have already paid for the full month.')))
                        : () => _showRequestDailyRideModal(activeRequest['driverId']),
                    ),
                ],
              ),

            const SizedBox(height: 25),

            if (!_isLoading && !_isDailyView) _buildFareStatusCard(),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (!hasApprovedDriver)
              Center(child: Text("You have to assign to a driver to use this feature.", style: TextStyle(color: context.pal.fg70, fontSize: 16)))
            else if (_isDailyView)
              Expanded(child: _buildDailyRidesList())
            else if (_payments.isEmpty)
              Center(child: Text("No payments made yet.", style: TextStyle(color: context.pal.fg70)))
            else
              // Payments List
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: context.pal.tint(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: context.pal.fg24),
                  ),
                  child: Column(
                    children: [
                      if (!isNarrow)
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Row(
                            children: [
                              Expanded(flex: 2, child: Text('MONTH', style: TextStyle(color: context.pal.fg70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 3, child: Text('DRIVER/BUS', style: TextStyle(color: context.pal.fg70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 2, child: Text('AMOUNT', style: TextStyle(color: context.pal.fg70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: context.pal.fg70, fontSize: 12, fontWeight: FontWeight.bold))),
                              Expanded(flex: 2, child: Text('METHOD', style: TextStyle(color: context.pal.fg70, fontSize: 12, fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ),
                      if (!isNarrow)
                        Divider(color: context.pal.fg24, height: 1),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _payments.length,
                          itemBuilder: (context, index) {
                            final payment = _payments[index];
                            final driverName = payment['driver']?['fullName'] ?? 'Driver';
                            
                            if (isNarrow) {
                              return Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(border: Border(bottom: BorderSide(color: context.pal.fg12))),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('${payment['month'] ?? '-'}', style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold, fontSize: 16)),
                                        Text('LKR ${payment['amount']}', style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text('Driver: $driverName', style: TextStyle(color: context.pal.fg70)),
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
                                        Text(payment['paymentMethod'] ?? 'IN_APP', style: TextStyle(color: context.pal.fg54, fontSize: 12)),
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
                                    Divider(color: context.pal.fg12, height: 1),
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
          Expanded(flex: 2, child: Text(month, style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold))),
          Expanded(flex: 3, child: Text(driver, style: TextStyle(color: context.pal.fg70))),
          Expanded(flex: 2, child: Text(amount, style: TextStyle(color: context.pal.fg))),
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
          Expanded(flex: 2, child: Text(method, style: TextStyle(color: context.pal.fg54, fontSize: 12))),
        ],
      ),
    );
  }

  void _showRequestDailyRideModal(int driverId) {
    String selectedTripType = 'ROUND_TRIP';
    DateTime selectedDate = DateTime.now();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            return AlertDialog(
              backgroundColor: context.pal.surface,
              title: Text('Request Daily Ride', style: TextStyle(color: context.pal.fg)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Date:', style: TextStyle(color: context.pal.fg70)),
                  ElevatedButton(
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: selectedDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (picked != null) {
                        setStateModal(() => selectedDate = picked);
                      }
                    },
                    child: Text('${selectedDate.toLocal()}'.split(' ')[0]),
                  ),
                  const SizedBox(height: 16),
                  Text('Trip Type:', style: TextStyle(color: context.pal.fg70)),
                  DropdownButton<String>(
                    dropdownColor: context.pal.surface,
                    value: selectedTripType,
                    style: TextStyle(color: context.pal.fg),
                    items: const [
                      DropdownMenuItem(value: 'ROUND_TRIP', child: Text('Round Trip')),
                      DropdownMenuItem(value: 'TO_UNI_ONLY', child: Text('To Uni Only')),
                      DropdownMenuItem(value: 'FROM_UNI_ONLY', child: Text('From Uni Only')),
                    ],
                    onChanged: (val) {
                      if (val != null) setStateModal(() => selectedTripType = val);
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('CANCEL', style: TextStyle(color: context.pal.fg54)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
                    
                    final result = await ApiService.createDailyRideRequest({
                      'driverId': driverId,
                      'date': '${selectedDate.toLocal()}'.split(' ')[0],
                      'tripType': selectedTripType,
                    });
                    
                    if (mounted) Navigator.pop(context);

                    if (result['success']) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Daily ride requested!')));
                      _fetchData();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
                    }
                  },
                  child: const Text('REQUEST'),
                ),
              ],
            );
          }
        );
      }
    );
  }

  Widget _buildDailyRidesList() {
    if (_dailyRequests.isEmpty) {
      return Center(child: Text("No daily rides found.", style: TextStyle(color: context.pal.fg70)));
    }
    
    final isMonthlyPaid = _myFare != null && _myFare!['status'] == 'PAID';
    
    return Container(
      decoration: BoxDecoration(
        color: context.pal.tint(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.pal.fg24),
      ),
      child: ListView.separated(
        itemCount: _dailyRequests.length,
        separatorBuilder: (_, __) => Divider(color: context.pal.fg24, height: 1),
        itemBuilder: (context, index) {
          final req = _dailyRequests[index];
          final date = req['date'];
          final type = req['tripType'] == 'ROUND_TRIP' ? 'Round Trip' : (req['tripType'] == 'TO_UNI_ONLY' ? 'To Uni' : 'From Uni');
          final status = req['status'];
          final isPaid = req['paymentId'] != null;
          final amount = req['fareAmount'] != null ? 'LKR ${req['fareAmount']}' : 'TBD';

          Color statusColor = Colors.orange;
          if (status == 'APPROVED') statusColor = Colors.green;
          if (status == 'REJECTED') statusColor = Colors.redAccent;

          return Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$date • $type', style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 10)),
                          const SizedBox(width: 10),
                          if (isPaid || isMonthlyPaid)
                            const Text('PAID', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10))
                          else if (status == 'APPROVED')
                            Text(_dailyRidePayments ? 'UNPAID' : 'PAY DRIVER IN CASH', style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 10)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(amount, style: TextStyle(color: context.pal.fg70, fontSize: 12)),
                    ],
                  ),
                ),
                if (_dailyRidePayments && status == 'APPROVED' && !isPaid && !isMonthlyPaid)
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
                    onPressed: () async {
                      showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
                      final result = await ApiService.payDailyRide(req['id']);
                      if (mounted) Navigator.pop(context);

                      if (result['success']) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful!')));
                        _fetchData();
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
                      }
                    },
                    child: Text('PAY NOW', style: TextStyle(color: context.pal.fg)),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
