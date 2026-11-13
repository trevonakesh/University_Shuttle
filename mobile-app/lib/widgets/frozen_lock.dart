import 'package:flutter/material.dart';
import '../utils/palette.dart';
import '../screens/student/student_payments.dart';
import '../services/api_service.dart';

import '../utils/lang.dart';
String _freezeMessage(String? reason, String month, double amountDue) {
  final fare = tr('LKR {amount}', {'amount': amountDue.toStringAsFixed(2)});
  if (reason == 'EXEMPT') {
    return ApiService.onlinePayments
        ? tr('Your driver marked you as not travelling in {month}, so your account is frozen for this month. It unfreezes automatically next month, or pay the fare ({fare}) if you plan to travel.', {'month': month, 'fare': fare})
        : tr('Your driver marked you as not travelling in {month}, so your account is frozen for this month. It unfreezes automatically next month, or hand your driver the fare ({fare}) and ask them to mark it as paid.', {'month': month, 'fare': fare});
  }
  final settle = tr(ApiService.onlinePayments
      ? 'Pay it to unfreeze your account.'
      : 'Hand it to your driver and ask them to mark it as paid to unfreeze your account.');
  return '${tr('Your {month} fare ({fare}) was not paid by the 10th.', {'month': month, 'fare': fare})} $settle';
}

/// Red banner shown on the student dashboard when the account is frozen.
class FrozenBanner extends StatelessWidget {
  final double amountDue;
  final String month;
  final String? reason; // 'UNPAID' | 'EXEMPT'

  const FrozenBanner({Key? key, required this.amountDue, required this.month, this.reason}) : super(key: key);

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
                Text(
                  tr(reason == 'EXEMPT' ? 'FROZEN — NOT TRAVELLING THIS MONTH' : 'ACCOUNT FROZEN'),
                  style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
                const SizedBox(height: 4),
                Text(
                  tr(_freezeMessage(reason, month, amountDue)),
                  style: TextStyle(color: context.pal.fg70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: context.pal.fg),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const StudentPaymentsScreen()),
            ),
            child: Text(tr(ApiService.onlinePayments ? 'PAY NOW' : 'VIEW FARE'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
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
  final String? reason; // 'UNPAID' | 'EXEMPT'

  const FrozenLock({Key? key, required this.amountDue, required this.month, this.reason}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock, color: Colors.redAccent, size: 70),
          const SizedBox(height: 20),
          Text(
            tr(reason == 'EXEMPT' ? 'FROZEN FOR $month' : 'ACCOUNT FROZEN'),
            style: const TextStyle(color: Colors.redAccent, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 2),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              tr(_freezeMessage(reason, month, amountDue)),
              textAlign: TextAlign.center,
              style: TextStyle(color: context.pal.fg70, fontSize: 13),
            ),
          ),
          const SizedBox(height: 25),
          ElevatedButton.icon(
            icon: const Icon(Icons.payment, size: 18),
            label: Text(tr(ApiService.onlinePayments ? 'PAY MONTHLY FARE' : 'VIEW MY FARE'), style: const TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: context.pal.fg,
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
