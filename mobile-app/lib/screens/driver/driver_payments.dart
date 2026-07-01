import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class DriverPaymentsScreen extends StatelessWidget {
  const DriverPaymentsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: 'Chaminda Dias',
      userRole: 'Driver',
      activeIndex: 4, // 4 corresponds to PAYMENTS
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
                      'PASSENGER PAYMENTS',
                      style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                    ),
                    SizedBox(height: 5),
                    Text(
                      "TRACK WHO HAS PAID FOR THE CURRENT MONTH (2026-06)",
                      style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
                    ),
                  ],
                ),
                // Month Selector (Mock)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white30),
                  ),
                  child: Row(
                    children: const [
                      Text('JUNE 2026', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      SizedBox(width: 10),
                      Icon(Icons.arrow_drop_down, color: Colors.white54),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),

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
                          Expanded(flex: 3, child: Text('STUDENT NAME', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Text('STUDENT ID', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Text('AMOUNT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Text('ACTION', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                        ],
                      ),
                    ),
                    const Divider(color: Colors.white24, height: 1),
                    Expanded(
                      child: ListView(
                        children: [
                          _buildPassengerRow('Supun Perera', 'ST-4029', 'LKR 4,500', true),
                          const Divider(color: Colors.white10, height: 1),
                          _buildPassengerRow('Nimal Fernando', 'ST-4055', 'LKR 4,500', false),
                          const Divider(color: Colors.white10, height: 1),
                          _buildPassengerRow('Ovin Perera', 'ST-4081', 'LKR 4,500', true),
                        ],
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

  Widget _buildPassengerRow(String name, String id, String amount, bool hasPaid) {
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
          Expanded(flex: 2, child: Text(id, style: const TextStyle(color: Colors.white70))),
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
          Expanded(
            flex: 2,
            child: Align(
              alignment: Alignment.centerLeft,
              child: hasPaid 
                ? const Icon(Icons.check_circle, color: Colors.green, size: 28)
                : OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white54),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: const Text('MARK PAID', style: TextStyle(fontSize: 10)),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
