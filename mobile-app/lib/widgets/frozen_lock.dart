import 'package:flutter/material.dart';
import '../screens/student/student_payments.dart';

/// Red banner shown on the student dashboard when the account is frozen.
class FrozenBanner extends StatelessWidget {
  final double amountDue;
  final String month;

  const FrozenBanner({Key? key, required this.amountDue, required this.month}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 25),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.redAccent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock, color: Colors.redAccent, size: 30),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ACCOUNT FROZEN',
                  style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your $month fare (LKR ${amountDue.toStringAsFixed(2)}) was not paid by the 10th. Pay it to unfreeze your account.',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const StudentPaymentsScreen()),
            ),
            child: const Text('PAY NOW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
          ),
        ],
      ),
    );
  }
}

/// Full-content lock shown in place of a feature screen's body while frozen.
class FrozenLock extends StatelessWidget {
  final double amountDue;
  final String month;

  const FrozenLock({Key? key, required this.amountDue, required this.month}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock, color: Colors.redAccent, size: 70),
          const SizedBox(height: 20),
          const Text(
            'ACCOUNT FROZEN',
            style: TextStyle(color: Colors.redAccent, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 2),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'This feature is locked because your $month fare (LKR ${amountDue.toStringAsFixed(2)}) was not paid by the 10th.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ),
          const SizedBox(height: 25),
          ElevatedButton.icon(
            icon: const Icon(Icons.payment, size: 18),
            label: const Text('PAY MONTHLY FARE', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
            ),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const StudentPaymentsScreen()),
            ),
          ),
        ],
      ),
    );
  }
}
