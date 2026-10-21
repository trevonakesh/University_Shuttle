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
    final questionController = TextEditingController();
    final option1Controller = TextEditingController();
    final option2Controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E2128),
        title: const Text('Create New Poll', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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
            const SizedBox(height: 15),
            TextField(
              controller: option1Controller,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Option 1 (e.g. Yes / Morning)',
                labelStyle: TextStyle(color: Colors.black54),
                filled: true,
                fillColor: Colors.white,
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
              ),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: option2Controller,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Option 2 (e.g. No / Evening)',
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
              if (questionController.text.isNotEmpty) {
                final now = DateTime.now();
                // E.g. "2026-07-05 11:47"
                final autoDate = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')} ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
                
                final res = await ApiService.createPoll({
                  'date': autoDate,
                  'question': questionController.text,
                  'option1': option1Controller.text.isNotEmpty ? option1Controller.text : 'COMING',
                  'option2': option2Controller.text.isNotEmpty ? option2Controller.text : 'NOT COMING'
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
    final profile = _user != null ? (_user!['profile'] ?? _user!['driver'] ?? {}) : {};
    return DashboardLayout(
      userName: profile['fullName'] ?? 'Driver',
      userRole: 'DRIVER',
      activeIndex: 2,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
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
                    final List<dynamic> option1Students = (poll['option1Students'] as List<dynamic>?) ?? (poll['comingStudents'] as List<dynamic>?) ?? [];
                    
                    int option1Count = 0;
                    int option2Count = 0;
                    if (poll['stats'] != null) {
                      option1Count = (poll['stats']['option1Count'] as num?)?.toInt() ?? (poll['stats']['comingCount'] as num?)?.toInt() ?? 0;
                      option2Count = (poll['stats']['option2Count'] as num?)?.toInt() ?? (poll['stats']['notComingCount'] as num?)?.toInt() ?? 0;
                    }
                    
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Column(
                        children: [
                          // Poll Header & Stats
                          Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              alignment: WrapAlignment.spaceBetween,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(poll['date'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 5),
                                    Text(poll['question'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                                  ],
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    _buildStatCard((poll['option1'] ?? 'COMING').toString().toUpperCase(), option1Count.toString(), Colors.green),
                                    const SizedBox(width: 15),
                                    _buildStatCard((poll['option2'] ?? 'NOT COMING').toString().toUpperCase(), option2Count.toString(), Colors.redAccent),
                                    const SizedBox(width: 15),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.redAccent),
                                      onPressed: () {
                                        final int pId = (poll['id'] as num?)?.toInt() ?? 0;
                                        if (pId != 0) _deletePoll(pId);
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          
                          // Table Header
                          const Padding(
                            padding: EdgeInsets.all(20.0),
                            child: Row(
                              children: [
                                Expanded(flex: 3, child: Text('STUDENT NAME', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                                Expanded(flex: 3, child: Text('PICKUP POINT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                                Expanded(flex: 2, child: Text('PHONE NUMBER', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                                Expanded(flex: 2, child: Text('SELECTION', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold))),
                              ],
                            ),
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          
                          // Passengers Coming List
                          if (option1Students.isEmpty)
                            Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Text('No students have selected ${poll['option1'] ?? 'Option 1'} yet.', style: const TextStyle(color: Colors.white54)),
                            )
                          else
                            ...option1Students.map((s) => _buildComingPassengerRow(s['name'] ?? '', s['pickupPoint'] ?? '', s['phone'] ?? '', poll['option1'] ?? 'COMING')).toList(),
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
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(count, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 5),
          Text(label, style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _buildComingPassengerRow(String name, String pickup, String phone, String option1Text) {
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
                const SizedBox(width: 10),
                Expanded(child: Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis)),
              ],
            ),
          ),
          Expanded(
            flex: 3,
            child: Row(
              children: [
                const Icon(Icons.location_on, color: Colors.white54, size: 14),
                const SizedBox(width: 4),
                Expanded(child: Text(pickup, style: const TextStyle(color: Colors.white70), overflow: TextOverflow.ellipsis)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Row(
              children: [
                const Icon(Icons.phone, color: Colors.white54, size: 14),
                const SizedBox(width: 4),
                Expanded(child: Text(phone, style: const TextStyle(color: Colors.white70), overflow: TextOverflow.ellipsis)),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
                ),
                child: Text(
                  option1Text.toUpperCase(),
                  style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
