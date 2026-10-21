import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

class NoticeBoardScreen extends StatefulWidget {
  final bool isDriver;
  final String userName;

  const NoticeBoardScreen({
    Key? key,
    required this.isDriver,
    required this.userName,
  }) : super(key: key);

  @override
  State<NoticeBoardScreen> createState() => _NoticeBoardScreenState();
}

class _NoticeBoardScreenState extends State<NoticeBoardScreen> {
  List<dynamic> _notices = [];
  List<dynamic> _myRequests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotices();
  }

  Future<void> _fetchNotices() async {
    setState(() => _isLoading = true);
    final notices = widget.isDriver 
        ? await ApiService.getDriverNotices()
        : await ApiService.getStudentNotices();
        
    List<dynamic> requests = [];
    if (!widget.isDriver) {
      requests = await ApiService.getStudentRequests();
    }
    
    if (mounted) {
      setState(() {
        _notices = notices;
        _myRequests = requests;
        _isLoading = false;
      });
    }
  }

  void _showCreateNoticeModal() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E2128),
        title: const Text('Post New Notice', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Title',
                labelStyle: TextStyle(color: Colors.black54),
                filled: true,
                fillColor: Colors.white,
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
              ),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: contentController,
              maxLines: 3,
              style: const TextStyle(color: Colors.black),
              decoration: const InputDecoration(
                labelText: 'Content',
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
              if (titleController.text.isNotEmpty && contentController.text.isNotEmpty) {
                final res = await ApiService.createNotice(titleController.text, contentController.text);
                if (res['success']) {
                  Navigator.pop(context);
                  _fetchNotices();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'])));
                }
              }
            },
            child: const Text('POST', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteNotice(int id) async {
    final success = await ApiService.deleteNotice(id);
    if (success) {
      _fetchNotices();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Notice deleted')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete notice')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasApprovedDriver = widget.isDriver || _myRequests.any((r) => r['status'] == 'APPROVED');

    return DashboardLayout(
      userName: widget.userName,
      userRole: widget.isDriver ? 'DRIVER' : 'STUDENT',
      activeIndex: widget.isDriver ? 5 : 6,
      child: Padding(
        padding: const EdgeInsets.all(40.0),
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
                        'NOTICE BOARD',
                        style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
                      ),
                      SizedBox(height: 5),
                      Text(
                        "IMPORTANT UPDATES AND ANNOUNCEMENTS",
                        style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                if (widget.isDriver)
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add_alert, size: 18),
                    label: const Text('POST NOTICE', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    onPressed: _showCreateNoticeModal,
                  ),
              ],
            ),
            const SizedBox(height: 40),

            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (!hasApprovedDriver)
              const Center(child: Text("You have to assign to a driver to use this feature.", style: TextStyle(color: Colors.white70, fontSize: 16)))
            else if (_notices.isEmpty)
              const Center(child: Text("No notices available.", style: TextStyle(color: Colors.white70)))
            else
              // Notices Grid/List
              Expanded(
                child: ListView.builder(
                  itemCount: _notices.length,
                  itemBuilder: (context, index) {
                    final notice = _notices[index];
                    
                    // Parse date (simplified for display)
                    String displayDate = notice['createdAt'] ?? '';
                    if (displayDate.length > 10) {
                      displayDate = displayDate.substring(0, 10);
                    }
                    
                    String author = widget.isDriver ? 'You' : (notice['driver']?['fullName'] ?? 'Driver');
                    bool isUrgent = notice['title'].toString().toLowerCase().contains('urgent');

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: _buildNoticeCard(
                        id: notice['id'],
                        title: notice['title'] ?? '',
                        content: notice['content'] ?? '',
                        date: displayDate,
                        author: author,
                        isUrgent: isUrgent,
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

  Widget _buildNoticeCard({
    required int id,
    required String title,
    required String content,
    required String date,
    required String author,
    required bool isUrgent,
  }) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isUrgent ? Colors.redAccent.withValues(alpha: 0.5) : Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (isUrgent) ...[
                    const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 20),
                    const SizedBox(width: 10),
                  ],
                  Text(
                    title,
                    style: TextStyle(
                      color: isUrgent ? Colors.redAccent : Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Text(
                    date,
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  if (widget.isDriver) ...[
                    const SizedBox(width: 15),
                    IconButton(
                      icon: const Icon(Icons.delete, color: Colors.redAccent, size: 20),
                      onPressed: () => _deleteNotice(id),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            content,
            style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: Colors.white24,
                radius: 12,
                child: Icon(Icons.person, color: Colors.white, size: 14),
              ),
              const SizedBox(width: 10),
              Text(
                'Posted by $author',
                style: const TextStyle(color: Colors.white54, fontSize: 12, fontStyle: FontStyle.italic),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
