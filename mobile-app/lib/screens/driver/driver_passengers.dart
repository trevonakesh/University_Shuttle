import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/dashboard_layout.dart';
import '../../services/api_service.dart';

import '../../utils/lang.dart';
class DriverPassengersScreen extends StatefulWidget {
  const DriverPassengersScreen({Key? key}) : super(key: key);

  @override
  State<DriverPassengersScreen> createState() => _DriverPassengersScreenState();
}

class _DriverPassengersScreenState extends State<DriverPassengersScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _passengers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = await ApiService.getUser();
    final requests = await ApiService.getDriverRequests();
    
    if (mounted) {
      setState(() {
        _user = user;
        // Filter for only approved requests (actual passengers)
        _passengers = requests.where((r) => r['status'] == 'APPROVED').toList();
        _isLoading = false;
      });
    }
  }

  Future<void> _editPassenger(int studentId, String studentName) async {
    final messenger = ScaffoldMessenger.of(context);
    final details = await ApiService.getPassengerDetails(studentId);
    if (!mounted) return;
    if (details == null) {
      messenger.showSnackBar(SnackBar(content: Text(tr('Could not load this student. Please try again.'))));
      return;
    }
    final message = await showDialog<String>(
      context: context,
      builder: (_) => _EditPassengerDialog(studentId: studentId, studentName: studentName, details: details),
    );
    if (message == null || !mounted) return;
    messenger.showSnackBar(SnackBar(content: Text(tr(message))));
    _fetchData();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: context.pal.bg,
        body: Center(child: CircularProgressIndicator(color: context.pal.fg)),
      );
    }

    final profile = _user?['profile'] ?? _user?['driver'];
    final name = profile?['fullName'] ?? 'Driver';

    return DashboardLayout(
      userName: name,
      userRole: 'DRIVER',
      activeIndex: 1, // Passengers is index 1
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              tr('MY PASSENGERS'),
              style: TextStyle(color: context.pal.fg, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 10),
            Text(
              tr('TOTAL PASSENGERS: {n}', {'n': _passengers.length}),
              style: TextStyle(color: context.pal.fg70, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
            
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: context.pal.tint(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: context.pal.fg24),
                ),
                child: _passengers.isEmpty
                    ? Center(
                        child: Text(
                          tr('NO PASSENGERS YET'),
                          style: TextStyle(color: context.pal.fg54, fontSize: 16),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: _passengers.length,
                        separatorBuilder: (context, index) => Divider(color: context.pal.fg24, height: 1),
                        itemBuilder: (context, index) {
                          final p = _passengers[index];
                          final student = p['student'];
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: context.pal.fg12,
                                  radius: 25,
                                  child: Icon(Icons.person, color: context.pal.fg, size: 30),
                                ),
                                const SizedBox(width: 20),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(tr(student['fullName'] ?? 'Unknown'), style: TextStyle(color: context.pal.fg, fontWeight: FontWeight.bold, fontSize: 16)),
                                      const SizedBox(height: 4),
                                      Text('${student['universityName'] ?? tr('Unknown Uni')} • ${student['pickupPoint'] ?? tr('Unknown Pickup')}', style: TextStyle(color: context.pal.fg54, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.green),
                                  ),
                                  child: Text(tr('APPROVED'), style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                                IconButton(
                                  icon: Icon(Icons.edit, color: context.pal.fg70),
                                  tooltip: tr('Edit student details'),
                                  onPressed: () {
                                    final int id = (p['studentId'] as num?)?.toInt() ?? 0;
                                    if (id != 0) _editPassenger(id, student['fullName'] ?? 'Student');
                                  },
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditPassengerDialog extends StatefulWidget {
  final int studentId;
  final String studentName;
  final Map<String, dynamic> details;

  const _EditPassengerDialog({required this.studentId, required this.studentName, required this.details});

  @override
  State<_EditPassengerDialog> createState() => _EditPassengerDialogState();
}

class _EditPassengerDialogState extends State<_EditPassengerDialog> {
  static const _labels = {
    'pickupPoint': 'Pickup point',
    'homeLocation': 'Home location',
    'emerContactName': 'Emergency contact name',
    'emerContactPhone': 'Emergency contact phone',
    'emerRelationship': 'Relationship to student',
  };

  late final Map<String, TextEditingController> _controllers = {
    for (final field in _labels.keys) field: TextEditingController(text: (widget.details[field] ?? '').toString()),
  };
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_controllers['pickupPoint']!.text.trim().isEmpty) {
      setState(() => _error = 'Pickup point cannot be empty.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final res = await ApiService.updatePassengerDetails(
      widget.studentId,
      _controllers.map((field, controller) => MapEntry(field, controller.text)),
    );
    if (!mounted) return;
    if (res['success'] == true) {
      Navigator.pop(context, res['message']?.toString() ?? 'Student details updated.');
    } else {
      setState(() {
        _saving = false;
        _error = res['message']?.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: context.pal.surface,
      title: Text(tr('Edit Student Details'), style: TextStyle(color: context.pal.fg)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tr('{name}. The student will be told about any change you save.', {'name': widget.studentName}),
                style: TextStyle(color: context.pal.fg70, fontSize: 13)),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(tr(_error!), style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              ),
            for (final entry in _labels.entries)
              Padding(
                padding: const EdgeInsets.only(top: 14),
                child: TextField(
                  controller: _controllers[entry.key],
                  maxLength: 200,
                  keyboardType: entry.key == 'emerContactPhone' ? TextInputType.phone : TextInputType.text,
                  style: const TextStyle(color: Colors.black),
                  decoration: InputDecoration(
                    labelText: tr(entry.value),
                    labelStyle: const TextStyle(color: Colors.black54),
                    counterText: '',
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: Text(tr('CANCEL'), style: TextStyle(color: context.pal.fg54)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
          onPressed: _saving ? null : _save,
          child: Text(tr(_saving ? 'SAVING...' : 'SAVE'), style: TextStyle(color: context.pal.fg)),
        ),
      ],
    );
  }
}
