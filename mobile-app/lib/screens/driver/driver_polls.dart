import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class DriverPollsScreen extends StatefulWidget {
  const DriverPollsScreen({Key? key}) : super(key: key);

  @override
  State<DriverPollsScreen> createState() => _DriverPollsScreenState();
}

class _DriverPollsScreenState extends State<DriverPollsScreen> {
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
    final polls = await ApiService.getDriverPolls();
    if (mounted) {
      setState(() {
        _user = user;
        _polls = polls;
        _isLoading = false;
      });
    }
  }

  void _showCreatePollModal() {
    final dateController = TextEditingController();
    final questionController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E2128),
        title: const Text('Create New Poll', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: dateController,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Date (e.g. Tomorrow, May 30)',
                labelStyle: TextStyle(color: Colors.black54),
                filled: true,
                fillColor: Colors.white,
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
              ),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: questionController,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Question',
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
              if (dateController.text.isNotEmpty && questionController.text.isNotEmpty) {
                final res = await ApiService.createPoll({
                  'date': dateController.text,
                  'question': questionController.text
                });
                if (res['success']) {
                  Navigator.pop(context);
                  _fetchData();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'])));
                }
              }
            },
            child: const Text('CREATE', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _deletePoll(int pollId) async {
    final success = await ApiService.deletePoll(pollId);
    if (success) {
      _fetchData();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Poll deleted')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete poll')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: _user != null ? _user!['profile']['fullName'] : 'Driver',
      userRole: 'DRIVER',
      activeIndex: 2,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'ATTENDANCE POLLS',
                        style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                      ),
                      SizedBox(height: 5),
                      Text(
                        "MANAGE DAILY ATTENDANCE AND SEAT AVAILABILITY",
                        style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                ElevatedButton.icon(
                  icon: const Icon(Icons.add_chart, size: 18),
                  label: const Text('CREATE POLL', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: _showCreatePollModal,
                ),
              ],
            ),
            const SizedBox(height: 40),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_polls.isEmpty)
              const Center(child: Text("No polls created yet.", style: TextStyle(color: Colors.white70)))
            else
              // Active Polls View
              Expanded(
                child: ListView.separated(
                  itemCount: _polls.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 20),
                  itemBuilder: (context, index) {
                    final poll = _polls[index];
                    final comingStudents = poll['comingStudents'] ?? [];
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Column(
                        children: [
                          // Poll Header & Stats
                          Padding(
                            padding: const EdgeInsets.all(25.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(poll['date'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 5),
                                      Text(poll['question'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                                    ],
                                  ),
                                ),
                                Row(
                                  children: [
                                    _buildStatCard('COMING', poll['stats']['comingCount'].toString(), Colors.green),
                                    const SizedBox(width: 15),
                                    _buildStatCard('NOT COMING', poll['stats']['notComingCount'].toString(), Colors.redAccent),
                                    const SizedBox(width: 15),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.redAccent),
                                      onPressed: () => _deletePoll(poll['id']),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          
                          // Table Header
                          Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Row(
                              children: const [
                                Expanded(flex: 3, child: Text('STUDENT NAME', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                                Expanded(flex: 3, child: Text('PICKUP POINT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                                Expanded(flex: 2, child: Text('PHONE NUMBER', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                                Expanded(flex: 2, child: Text('STATUS', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                              ],
                            ),
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          
                          // Passengers Coming List
                          if (comingStudents.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(20.0),
                              child: Text('No students have confirmed attendance yet.', style: TextStyle(color: Colors.white54)),
                            )
                          else
                            ...comingStudents.map((s) => _buildComingPassengerRow(s['name'] ?? '', s['pickupPoint'] ?? '', s['phone'] ?? '')).toList(),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(count, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 5),
          Text(label, style: TextStyle(color: color.withOpacity(0.8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _buildComingPassengerRow(String name, String pickup, String phone) {
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
          Expanded(
            flex: 3,
            child: Row(
              children: [
                const Icon(Icons.location_on, color: Colors.white54, size: 14),
                const SizedBox(width: 8),
                Text(pickup, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Row(
              children: [
                const Icon(Icons.phone, color: Colors.white54, size: 14),
                const SizedBox(width: 8),
                Text(phone, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withOpacity(0.5)),
                ),
                child: const Text('COMING', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
