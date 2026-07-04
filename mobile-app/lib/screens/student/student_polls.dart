import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class StudentPollsScreen extends StatefulWidget {
  const StudentPollsScreen({Key? key}) : super(key: key);

  @override
  State<StudentPollsScreen> createState() => _StudentPollsScreenState();
}

class _StudentPollsScreenState extends State<StudentPollsScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _polls = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUser();
    final polls = await ApiService.getStudentPolls();
    if (mounted) {
      setState(() {
        _user = user;
        _polls = polls;
        _isLoading = false;
      });
    }
  }

  Future<void> _vote(int pollId, bool isComing) async {
    final res = await ApiService.votePoll(pollId, isComing);
    if (res['success']) {
      _fetchData();
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'])));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: _user != null ? _user!['profile']['fullName'] : 'Student',
      userRole: 'STUDENT',
      activeIndex: 3,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'ATTENDANCE POLLS',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            const Text(
              "CONFIRM YOUR SEAT FOR UPCOMING TRIPS",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_polls.isEmpty)
              const Center(child: Text("No polls available from your driver yet.", style: TextStyle(color: Colors.white70)))
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
  }) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: hasVoted 
              ? (isComing == true ? Colors.green.withOpacity(0.5) : Colors.redAccent.withOpacity(0.5)) 
              : Colors.white24,
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
                date,
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  const Icon(Icons.directions_bus, color: Colors.white54, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    driverName,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            question,
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
          const SizedBox(height: 25),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasVoted && isComing == true ? Colors.green : Colors.white10,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  onPressed: () => _vote(id, true),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, color: hasVoted && isComing == true ? Colors.white : Colors.white54, size: 18),
                      const SizedBox(width: 8),
                      const Text('YES, I AM COMING', style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasVoted && isComing == false ? Colors.redAccent : Colors.white10,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  onPressed: () => _vote(id, false),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cancel_outlined, color: hasVoted && isComing == false ? Colors.white : Colors.white54, size: 18),
                      const SizedBox(width: 8),
                      const Text('NO, I AM NOT', style: TextStyle(fontWeight: FontWeight.bold)),
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
