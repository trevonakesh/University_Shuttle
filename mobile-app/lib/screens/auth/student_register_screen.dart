import 'dart:ui';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../student/student_dashboard.dart';
import 'dart:convert';

class StudentRegisterScreen extends StatefulWidget {
  const StudentRegisterScreen({Key? key}) : super(key: key);

  @override
  State<StudentRegisterScreen> createState() => _StudentRegisterScreenState();
}

class _StudentRegisterScreenState extends State<StudentRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Text Controllers
  final _fullNameCtrl = TextEditingController();
  final _nicCtrl = TextEditingController();
  final _studentIdCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController(); // Needed for account creation
  final _regNoCtrl = TextEditingController();
  final _homeLocCtrl = TextEditingController();
  final _pickupCtrl = TextEditingController();
  final _emerNameCtrl = TextEditingController();
  final _emerPhoneCtrl = TextEditingController();

  // Dropdown States
  String? _university;
  String? _faculty;
  String? _program;
  String? _academicYear;
  String? _destination;
  String? _relationship;

  void _submitRegistration() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      final payload = {
        'fullName': _fullNameCtrl.text,
        'nic': _nicCtrl.text,
        'studentId': _studentIdCtrl.text,
        'phone': _phoneCtrl.text,
        'email': _emailCtrl.text,
        'password': _passwordCtrl.text,
        'universityName': _university ?? 'Unknown',
        'faculty': _faculty,
        'degreeProgram': _program,
        'academicYear': _academicYear,
        'registrationNo': _regNoCtrl.text,
        'homeLocation': _homeLocCtrl.text,
        'pickupPoint': _pickupCtrl.text,
        'destination': _destination,
        'emerContactName': _emerNameCtrl.text,
        'emerContactPhone': _emerPhoneCtrl.text,
        'emerRelationship': _relationship,
        'profilePhotoUrl': null,
      };

      final result = await ApiService.studentRegister(payload);
      
      setState(() => _isLoading = false);

      if (result['success']) {
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentDashboardScreen()));
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'] ?? 'Registration failed')));
      }
    }
  }

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _nicCtrl.dispose();
    _studentIdCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _regNoCtrl.dispose();
    _homeLocCtrl.dispose();
    _pickupCtrl.dispose();
    _emerNameCtrl.dispose();
    _emerPhoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 800;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=3538&auto=format&fit=crop',
            fit: BoxFit.cover,
          ),
          Container(color: Colors.black.withOpacity(0.75)),
          
          SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isDesktop ? 60.0 : 20.0,
                      vertical: 40.0,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back, color: Colors.white),
                              onPressed: () => Navigator.pop(context),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('STUDENT REGISTRATION', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.5)),
                                SizedBox(height: 4),
                                Text('PLEASE FILL IN YOUR DETAILS TO CREATE YOUR STUDENT ACCOUNT', style: TextStyle(fontSize: 10, color: Colors.white70, letterSpacing: 1)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 30),
                        _buildFormCard(context, isDesktop),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormCard(BuildContext context, bool isDesktop) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildSectionTitle('PERSONAL INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('FULL NAME', 'ENTER FULL NAME', _fullNameCtrl),
                  _buildInputCol('NIC NUMBER', 'ENTER NIC NUMBER', _nicCtrl),
                  _buildInputCol('STUDENT ID', 'ENTER STUDENT ID', _studentIdCtrl),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('PHONE NUMBER', 'ENTER PHONE NUMBER', _phoneCtrl),
                  _buildInputCol('EMAIL ADDRESS', 'ENTER EMAIL ADDRESS', _emailCtrl),
                  _buildInputCol('PASSWORD', 'ENTER PASSWORD', _passwordCtrl, obscureText: true),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildPhotoUploadCol(),
                  if (isDesktop) Expanded(child: const SizedBox()),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('UNIVERSITY INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('UNIVERSITY NAME', 'SELECT UNIVERSITY', ['Colombo', 'Peradeniya', 'Moratuwa'], _university, (val) => setState(() => _university = val)),
                  _buildDropdownCol('FACULTY', 'SELECT FACULTY', ['Science', 'Engineering', 'Arts'], _faculty, (val) => setState(() => _faculty = val)),
                  _buildDropdownCol('DEGREE / PROGRAM', 'SELECT PROGRAM', ['BSc', 'BEng', 'BA'], _program, (val) => setState(() => _program = val)),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('ACADEMIC YEAR', 'SELECT ACADEMIC YEAR', ['Year 1', 'Year 2', 'Year 3', 'Year 4'], _academicYear, (val) => setState(() => _academicYear = val)),
                  _buildInputCol('REGISTRATION NUMBER', 'ENTER REGISTRATION NUMBER', _regNoCtrl),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('TRAVEL INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('HOME LOCATION', 'ENTER HOME LOCATION', _homeLocCtrl),
                  _buildInputCol('MAIN ROAD / PICKUP POINT', 'ENTER PICKUP POINT', _pickupCtrl),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('DESTINATION UNIVERSITY', 'SELECT DESTINATION UNIVERSITY', ['Colombo', 'Peradeniya', 'Moratuwa'], _destination, (val) => setState(() => _destination = val)),
                  if (isDesktop) Expanded(child: const SizedBox()),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('EMERGENCY CONTACT'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('CONTACT PERSON NAME', 'ENTER CONTACT PERSON NAME', _emerNameCtrl),
                  _buildInputCol('PHONE NUMBER', 'ENTER CONTACT PHONE NUMBER', _emerPhoneCtrl),
                  _buildDropdownCol('RELATIONSHIP', 'SELECT RELATIONSHIP', ['Parent', 'Sibling', 'Guardian'], _relationship, (val) => setState(() => _relationship = val)),
                ]),
                
                const SizedBox(height: 50),
                
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25), side: const BorderSide(color: Colors.white30)),
                    ),
                    onPressed: _isLoading ? null : _register,
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('CREATE ACCOUNT', style: TextStyle(color: Colors.white, letterSpacing: 2, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2));
  }

  Widget _buildResponsiveRow(bool isDesktop, List<Widget> children) {
    if (isDesktop) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children.map((child) {
          if (child is Expanded) return child;
          return Expanded(child: Padding(padding: const EdgeInsets.only(right: 20.0), child: child));
        }).toList(),
      );
    } else {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children.map((child) {
          if (child is Expanded) return const SizedBox.shrink();
          return Padding(padding: const EdgeInsets.only(bottom: 20.0), child: child);
        }).toList(),
      );
    }
  }

  Widget _buildInputCol(String label, String hint, TextEditingController controller, {bool obscureText = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.2))),
          child: TextFormField(
            controller: controller,
            obscureText: obscureText,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: Colors.white54, fontSize: 10), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15)),
            validator: (value) => value == null || value.isEmpty ? 'Required' : null,
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownCol(String label, String hint, List<String> items, String? currentValue, void Function(String?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.2))),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: currentValue,
              hint: Text(hint, style: const TextStyle(color: Colors.white54, fontSize: 10)),
              dropdownColor: Colors.grey.shade900,
              icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 16),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(color: Colors.white)))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoUploadCol() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('PROFILE PHOTO', style: TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          height: 100,
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.white.withOpacity(0.3), style: BorderStyle.solid)),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.cloud_upload_outlined, color: Colors.white, size: 24),
                SizedBox(height: 4),
                Text('UPLOAD PHOTO', style: TextStyle(color: Colors.white, fontSize: 10)),
                SizedBox(height: 2),
                Text('JPG, PNG (MAX 2MB)', style: TextStyle(color: Colors.white54, fontSize: 8)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
