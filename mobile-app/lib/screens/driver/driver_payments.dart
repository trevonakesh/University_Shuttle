import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverPaymentsScreen extends StatefulWidget {
  const DriverPaymentsScreen({Key? key}) : super(key: key);

  @override
  State<DriverPaymentsScreen> createState() => _DriverPaymentsScreenState();
}

class _DriverPaymentsScreenState extends State<DriverPaymentsScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _payments = [];
  double _walletBalance = 0.0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final payments = await ApiService.getDriverPayments();
    final balance = await ApiService.getWalletBalance();
    
    if (mounted) {
      setState(() {
        _user = user;
        _payments = payments;
        _walletBalance = balance;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _user != null ? (_user!['profile'] ?? _user!['driver'] ?? {}) : {};
    return DashboardLayout(
      userName: profile['fullName'] ?? 'Driver',
      userRole: 'DRIVER',
      activeIndex: 3,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'EARNINGS & PAYMENTS',
                      style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                    ),
                    SizedBox(height: 5),
                    Text(
                      "TRACK PASSENGER PAYMENTS AND YOUR WALLET BALANCE",
                      style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
                    ),
                  ],
                ),
                // Wallet Balance Card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.green.withOpacity(0.3)),
                  ),
                  child: Row(
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
                ),
              ],
            ),
            const SizedBox(height: 40),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_payments.isEmpty)
              const Center(child: Text("No payments received yet.", style: TextStyle(color: Colors.white70)))
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
                            Expanded(flex: 3, child: Text('STUDENT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('MONTH', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('TOTAL', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('PLATFORM FEE', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('NET EARNED', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                            Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          ],
                        ),
                      ),
                      const Divider(color: Colors.white24, height: 1),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _payments.length,
                          itemBuilder: (context, index) {
                            final payment = _payments[index];
                            final studentName = payment['student']?['fullName'] ?? 'Student';
                            final totalAmount = payment['amount'] ?? 0;
                            final commission = payment['adminCommission'] ?? 0;
                            final netEarned = totalAmount - commission;
                            
                            return Column(
                              children: [
                                _buildPassengerRow(
                                  studentName, 
                                  payment['month'] ?? '-', 
                                  'LKR $totalAmount', 
                                  'LKR $commission', 
                                  'LKR $netEarned', 
                                  payment['status'] == 'COMPLETED',
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

  Widget _buildPassengerRow(String name, String month, String amount, String commission, String netEarned, bool hasPaid) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Colors.white24,
                  radius: 16,
                  child: Icon(Icons.person, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 15),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(flex: 2, child: Text(month, style: const TextStyle(color: Colors.white70))),
          Expanded(flex: 2, child: Text(amount, style: const TextStyle(color: Colors.white54))),
          Expanded(flex: 2, child: Text(commission, style: const TextStyle(color: Colors.redAccent))),
          Expanded(flex: 2, child: Text(netEarned, style: const TextStyle(color: Colors.green))),
          Expanded(
            flex: 2,
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: hasPaid ? Colors.green : Colors.redAccent,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  hasPaid ? 'PAID' : 'UNPAID', 
                  style: TextStyle(color: hasPaid ? Colors.green : Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
