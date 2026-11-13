import 'dart:ui';
import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/dashboard_layout.dart';
import '../../widgets/frozen_lock.dart';
import '../../services/api_service.dart';

import '../../utils/lang.dart';
class StudentPollsScreen extends StatefulWidget {
  const StudentPollsScreen({Key? key}) : super(key: key);

  @override
  State<StudentPollsScreen> createState() => _StudentPollsScreenState();
}

class _StudentPollsScreenState extends State<StudentPollsScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _polls = [];
  List<dynamic> _myRequests = [];
  Map<String, dynamic>? _myFare;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.fetchMe();
    final polls = await ApiService.getStudentPolls();
    final requests = await ApiService.getStudentRequests();
    final fare = await ApiService.getMyFare();
    if (mounted) {
      setState(() {
        _user = user;
        _polls = polls;
        _myRequests = requests;
        _myFare = fare;
        _isLoading = false;
      });
    }
  }

  Future<void> _vote(int pollId, bool isComing) async {
    final res = await ApiService.votePoll(pollId, isComing);
    if (res['success']) {
      _fetchData();
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(tr(res['message']))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _user != null ? (_user!['profile'] ?? _user!['student'] ?? {}) : {};
    final userName = profile['fullName'] ?? 'Student';
    final hasApprovedDriver = _myRequests.any((r) => r['status'] == 'APPROVED');

    return DashboardLayout(
      userName: userName,
      userRole: 'STUDENT',
      activeIndex: 3,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              tr('ATTENDANCE POLLS'),
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            Text(
              tr("CONFIRM YOUR SEAT FOR UPCOMING TRIPS"),
              style: TextStyle(color: context.pal.fg70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_myFare?['frozen'] == true)
              Expanded(
                child: FrozenLock(
                  amountDue: (_myFare?['amountDue'] as num?)?.toDouble() ?? 0,
                  month: _myFare?['month'] ?? '',
                  reason: _myFare?['freezeReason'],
                ),
              )
            else if (!hasApprovedDriver)
              Center(child: Text(tr("You have to assign to a driver to use this feature."), style: TextStyle(color: context.pal.fg70, fontSize: 16)))
            else if (_polls.isEmpty)
              Center(child: Text(tr("No polls available from your driver yet."), style: TextStyle(color: context.pal.fg70)))
            else
              // Polls List
              Expanded(
                child: ListView.builder(
                  itemCount: _polls.length,
                  itemBuilder: (context, index) {
                    final poll = _polls[index];
                    final responses = poll['responses'] as List<dynamic>? ?? [];
                    final hasVoted = responses.isNotEmpty;
                    final isComing = hasVoted ? responses[0]['isComing'] as bool? : null;
                    final driverName = poll['driver']?['fullName'] ?? 'Driver';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: _buildPollCard(
                        id: poll['id'],
                        date: poll['date'] ?? '',
                        driverName: driverName,
                        question: poll['question'] ?? '',
                        hasVoted: hasVoted,
                        isComing: isComing,
                        option1: poll['option1'] ?? 'COMING',
                        option2: poll['option2'] ?? 'NOT COMING',
                      ),
                    );
                  }
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPollCard({
    required int id,
    required String date,
    required String driverName,
    required String question,
    required bool hasVoted,
    bool? isComing,
    required String option1,
    required String option2,
  }) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: context.pal.tint(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: hasVoted 
              ? (isComing == true ? Colors.green.withValues(alpha: 0.5) : Colors.redAccent.withValues(alpha: 0.5)) 
              : context.pal.fg24,
          width: hasVoted ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                tr(date),
                style: TextStyle(color: context.pal.fg, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  Icon(Icons.directions_bus, color: context.pal.fg54, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    tr(driverName),
                    style: TextStyle(color: context.pal.fg70, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            tr(question),
            style: TextStyle(color: context.pal.fg70, fontSize: 16),
          ),
          const SizedBox(height: 25),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasVoted && isComing == true ? Colors.green : context.pal.fg12,
                    foregroundColor: context.pal.fg,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  onPressed: () => _vote(id, true),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, color: hasVoted && isComing == true ? context.pal.fg : context.pal.fg54, size: 18),
                      const SizedBox(width: 8),
                      Text(tr(option1.toUpperCase()), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasVoted && isComing == false ? Colors.redAccent : context.pal.fg12,
                    foregroundColor: context.pal.fg,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  onPressed: () => _vote(id, false),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cancel_outlined, color: hasVoted && isComing == false ? context.pal.fg : context.pal.fg54, size: 18),
                      const SizedBox(width: 8),
                      Text(tr(option2.toUpperCase()), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
