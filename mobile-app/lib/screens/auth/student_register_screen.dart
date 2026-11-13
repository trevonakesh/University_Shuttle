import 'dart:ui';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../utils/palette.dart';
import '../../widgets/app_background.dart';
import '../../widgets/custom_signup_fields.dart';
import 'package:image_picker/image_picker.dart';
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

  XFile? _profilePhoto;
  final _picker = ImagePicker();

  Map<String, dynamic>? _form;
  final Map<String, String> _customAnswers = {};

  @override
  void initState() {
    super.initState();
    _loadForm();
  }

  Future<void> _loadForm() async {
    final form = await ApiService.getSignupForm();
    if (!mounted) return;
    if (form == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('Could not load the sign-up form.'),
        duration: const Duration(days: 1),
        action: SnackBarAction(label: 'RETRY', onPressed: _loadForm),
      ));
      return;
    }
    setState(() => _form = form);
  }

  List<String> _choices(String list) => List<String>.from(_form?['options']?[list] ?? const []);
  bool _shown(String field) => !((_form?['student']?['hidden'] as List?) ?? const []).contains(field);
  bool _anyShown(List<String> fields) => fields.any(_shown);
  List<dynamic> get _customFields => (_form?['student']?['custom'] as List?) ?? const [];

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _profilePhoto = image);
    }
  }

  void _submitRegistration() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      String? profileUrl = _profilePhoto != null ? await ApiService.uploadImage(_profilePhoto!) : null;

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
        'profilePhotoUrl': profileUrl,
        'customFields': _customAnswers,
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
          const AppBackground(overlayOpacity: 0.75),
          
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: IconButton(
                                icon: Icon(Icons.arrow_back, color: context.pal.fg),
                                onPressed: () => Navigator.pop(context),
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                              ),
                            ),
                            const SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('STUDENT REGISTRATION', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: context.pal.fg, letterSpacing: 1.5)),
                                  SizedBox(height: 4),
                                  Text('PLEASE FILL IN YOUR DETAILS TO CREATE YOUR STUDENT ACCOUNT', style: TextStyle(fontSize: 10, color: context.pal.fg70, letterSpacing: 1)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 30),
                        if (_form == null)
                          Center(child: CircularProgressIndicator(color: context.pal.fg))
                        else
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
            color: context.pal.tint(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.pal.tint(0.2), width: 1),
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
                  if (_shown('nic')) _buildInputCol('NIC NUMBER', 'ENTER NIC NUMBER', _nicCtrl),
                  if (_shown('studentId')) _buildInputCol('STUDENT ID', 'ENTER STUDENT ID', _studentIdCtrl),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('PHONE NUMBER', 'ENTER PHONE NUMBER', _phoneCtrl),
                  _buildInputCol('EMAIL ADDRESS', 'ENTER EMAIL ADDRESS', _emailCtrl),
                  _buildInputCol('PASSWORD', '8+ CHARACTERS, A LETTER AND A NUMBER', _passwordCtrl, obscureText: true),
                ]),
                const SizedBox(height: 20),
                if (_shown('profilePhotoUrl'))
                  _buildResponsiveRow(isDesktop, [
                    _buildPhotoUploadCol(),
                    if (isDesktop) const Expanded(child: SizedBox()),
                    if (isDesktop) const Expanded(child: SizedBox()),
                  ]),
                
                const SizedBox(height: 30),
                Divider(color: context.pal.fg24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('UNIVERSITY INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('UNIVERSITY NAME', 'SELECT UNIVERSITY', _choices('universities'), _university, (val) => setState(() => _university = val)),
                  if (_shown('faculty')) _buildDropdownCol('FACULTY', 'SELECT FACULTY', _choices('faculties'), _faculty, (val) => setState(() => _faculty = val)),
                  if (_shown('degreeProgram')) _buildDropdownCol('DEGREE / PROGRAM', 'SELECT PROGRAM', _choices('degreePrograms'), _program, (val) => setState(() => _program = val)),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  if (_shown('academicYear')) _buildDropdownCol('ACADEMIC YEAR', 'SELECT ACADEMIC YEAR', _choices('academicYears'), _academicYear, (val) => setState(() => _academicYear = val)),
                  if (_shown('registrationNo')) _buildInputCol('REGISTRATION NUMBER', 'ENTER REGISTRATION NUMBER', _regNoCtrl),
                  if (isDesktop) const Expanded(child: SizedBox()),
                ]),
                
                const SizedBox(height: 30),
                Divider(color: context.pal.fg24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('TRAVEL INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  if (_shown('homeLocation')) _buildInputCol('HOME LOCATION', 'ENTER HOME LOCATION', _homeLocCtrl),
                  _buildInputCol('MAIN ROAD / PICKUP POINT', 'ENTER PICKUP POINT', _pickupCtrl),
                  if (isDesktop) const Expanded(child: SizedBox()),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('DESTINATION UNIVERSITY', 'SELECT DESTINATION UNIVERSITY', _choices('universities'), _destination, (val) => setState(() => _destination = val)),
                  if (isDesktop) const Expanded(child: SizedBox()),
                  if (isDesktop) const Expanded(child: SizedBox()),
                ]),
                
                if (_anyShown(['emerContactName', 'emerContactPhone', 'emerRelationship'])) ...[
                  const SizedBox(height: 30),
                  Divider(color: context.pal.fg24, thickness: 1),
                  const SizedBox(height: 30),

                  _buildSectionTitle('EMERGENCY CONTACT'),
                  const SizedBox(height: 20),
                  _buildResponsiveRow(isDesktop, [
                    if (_shown('emerContactName')) _buildInputCol('CONTACT PERSON NAME', 'ENTER CONTACT PERSON NAME', _emerNameCtrl),
                    if (_shown('emerContactPhone')) _buildInputCol('PHONE NUMBER', 'ENTER CONTACT PHONE NUMBER', _emerPhoneCtrl),
                    if (_shown('emerRelationship')) _buildDropdownCol('RELATIONSHIP', 'SELECT RELATIONSHIP', _choices('relationships'), _relationship, (val) => setState(() => _relationship = val)),
                  ]),
                ],

                if (_customFields.isNotEmpty) ...[
                  const SizedBox(height: 30),
                  Divider(color: context.pal.fg24, thickness: 1),
                  const SizedBox(height: 30),

                  _buildSectionTitle('ADDITIONAL INFORMATION'),
                  const SizedBox(height: 20),
                  CustomSignupFields(fields: _customFields, answers: _customAnswers),
                ],

                const SizedBox(height: 50),
                
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.pal.btn,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25), side: BorderSide(color: context.pal.fg38)),
                    ),
                    onPressed: _isLoading ? null : _submitRegistration,
                    child: _isLoading
                        ? CircularProgressIndicator(color: Colors.white)
                        : Text('CREATE ACCOUNT', style: TextStyle(color: Colors.white, letterSpacing: 2, fontWeight: FontWeight.bold)),
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
    return Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.pal.fg, letterSpacing: 1.2));
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
        Text(label, style: TextStyle(color: context.pal.fg70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(color: context.pal.tint(0.9), borderRadius: BorderRadius.circular(20), border: Border.all(color: context.pal.tint(0.2))),
          child: TextFormField(
            controller: controller,
            obscureText: obscureText,
            style: const TextStyle(color: Colors.black, fontSize: 12),
            decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: Colors.black54, fontSize: 10), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15)),
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
        Text(label, style: TextStyle(color: context.pal.fg70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(color: context.pal.tint(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: context.pal.tint(0.2))),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: currentValue,
              hint: Text(hint, style: TextStyle(color: context.pal.fg54, fontSize: 10)),
              dropdownColor: context.pal.surface,
              icon: Icon(Icons.keyboard_arrow_down, color: context.pal.fg54, size: 16),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: TextStyle(color: context.pal.fg)))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoUploadCol() {
    final bool isSelected = _profilePhoto != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('PROFILE PHOTO', style: TextStyle(color: context.pal.fg70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            height: 100,
            decoration: BoxDecoration(
              color: isSelected ? Colors.transparent : context.pal.tint(0.05),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: context.pal.tint(0.3), style: BorderStyle.solid),
              image: isSelected 
                  ? DecorationImage(
                      image: kIsWeb
                          ? NetworkImage(_profilePhoto!.path) as ImageProvider
                          : FileImage(File(_profilePhoto!.path)),
                      fit: BoxFit.cover,
                    ) 
                  : null,
            ),
            child: isSelected 
                ? null 
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.cloud_upload_outlined, color: context.pal.fg, size: 24),
                        SizedBox(height: 4),
                        Text('UPLOAD PHOTO', style: TextStyle(color: context.pal.fg, fontSize: 10)),
                        SizedBox(height: 2),
                        Text('JPG, PNG (MAX 2MB)', style: TextStyle(color: context.pal.fg54, fontSize: 8)),
                      ],
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
