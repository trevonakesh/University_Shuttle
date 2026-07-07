import 'dart:ui';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../driver/driver_dashboard.dart';
import 'driver_pending_screen.dart';

class DriverRegisterScreen extends StatefulWidget {
  const DriverRegisterScreen({Key? key}) : super(key: key);

  @override
  State<DriverRegisterScreen> createState() => _DriverRegisterScreenState();
}

class _DriverRegisterScreenState extends State<DriverRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Personal
  final _fullNameCtrl = TextEditingController();
  final _nicCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController(); // Added for account creation
  final _licenseCtrl = TextEditingController();
  
  // Bank
  String? _bankName;
  final _accNumCtrl = TextEditingController();
  final _accHolderCtrl = TextEditingController();

  // Bus Info
  final _busRegCtrl = TextEditingController();
  final _busCapCtrl = TextEditingController();
  final _routeCtrl = TextEditingController();
  final _startCtrl = TextEditingController();
  String? _destination;
  final _feeCtrl = TextEditingController();

  // Schedule
  String? _scheduleType;
  TimeOfDay? _pickupTime;
  TimeOfDay? _dropTime;

  // Documents
  XFile? _profilePhoto;
  XFile? _nicCopy;
  XFile? _licenseCopy;
  XFile? _vehicleReg;
  XFile? _busPhoto;

  final _picker = ImagePicker();

  Future<void> _pickImage(String type) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        if (type == 'profile') _profilePhoto = image;
        else if (type == 'nic') _nicCopy = image;
        else if (type == 'license') _licenseCopy = image;
        else if (type == 'vehicle') _vehicleReg = image;
        else if (type == 'bus') _busPhoto = image;
      });
    }
  }

  Future<void> _register() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
        // Upload images first
        String? profileUrl = _profilePhoto != null ? await ApiService.uploadImage(_profilePhoto!) : null;
        String? nicUrl = _nicCopy != null ? await ApiService.uploadImage(_nicCopy!) : null;
        String? licenseUrl = _licenseCopy != null ? await ApiService.uploadImage(_licenseCopy!) : null;
        String? vehicleRegUrl = _vehicleReg != null ? await ApiService.uploadImage(_vehicleReg!) : null;
        String? busPhotoUrl = _busPhoto != null ? await ApiService.uploadImage(_busPhoto!) : null;

        final payload = {
          'fullName': _fullNameCtrl.text,
          'nic': _nicCtrl.text,
          'phone': _phoneCtrl.text,
          'email': _emailCtrl.text,
          'password': _passwordCtrl.text,
          'licenseNumber': _licenseCtrl.text,
          'bankName': _bankName,
          'accNumber': _accNumCtrl.text,
          'accHolder': _accHolderCtrl.text,
          'busRegNumber': _busRegCtrl.text,
          'busCapacity': _busCapCtrl.text,
          'routeName': _routeCtrl.text,
          'startingPoint': _startCtrl.text,
          'destination': _destination,
          'monthlyFee': _feeCtrl.text,
          'scheduleType': _scheduleType,
          'pickupTime': _pickupTime?.format(context),
          'dropTime': _dropTime?.format(context),
          'profilePhotoUrl': profileUrl,
          'nicCopyUrl': nicUrl,
          'licenseCopyUrl': licenseUrl,
          'vehicleRegUrl': vehicleRegUrl,
          'busPhotoUrl': busPhotoUrl,
        };

      final result = await ApiService.driverRegister(payload);

      setState(() => _isLoading = false);

      if (result['success']) {
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const DriverPendingScreen()),
          (route) => false,
        );
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Registration failed')),
        );
      }
    }
  }

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _nicCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _licenseCtrl.dispose();
    _accNumCtrl.dispose();
    _accHolderCtrl.dispose();
    _busRegCtrl.dispose();
    _busCapCtrl.dispose();
    _routeCtrl.dispose();
    _startCtrl.dispose();
    _feeCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectTime(BuildContext context, bool isPickup) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() {
        if (isPickup) {
          _pickupTime = picked;
        } else {
          _dropTime = picked;
        }
      });
    }
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
                    padding: EdgeInsets.symmetric(horizontal: isDesktop ? 60.0 : 20.0, vertical: 40.0),
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
                                Text('DRIVER REGISTRATION', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.5)),
                                SizedBox(height: 4),
                                Text('PLEASE FILL IN YOUR DETAILS TO REGISTER AS A DRIVER', style: TextStyle(fontSize: 10, color: Colors.white70, letterSpacing: 1)),
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
                  _buildInputCol('PHONE NUMBER', 'ENTER PHONE NUMBER', _phoneCtrl),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('EMAIL ADDRESS', 'ENTER EMAIL ADDRESS', _emailCtrl),
                  _buildInputCol('PASSWORD', 'ENTER PASSWORD', _passwordCtrl, obscureText: true),
                  _buildInputCol('DRIVING LICENSE NUMBER', 'ENTER LICENSE NUMBER', _licenseCtrl),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildUploadCol('PROFILE PHOTO', 'UPLOAD PHOTO', _profilePhoto, () => _pickImage('profile')),
                  if (isDesktop) Expanded(child: const SizedBox()),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('BANK DETAILS'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('BANK NAME', 'SELECT BANK', ['BOC', 'Commercial', 'HNB', 'Sampath'], _bankName, (v) => setState(() => _bankName = v)),
                  _buildInputCol('ACCOUNT NUMBER', 'ENTER ACCOUNT NUMBER', _accNumCtrl),
                  _buildInputCol('ACCOUNT HOLDER NAME', 'ENTER ACCOUNT HOLDER NAME', _accHolderCtrl),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('BUS INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('BUS REGISTRATION NUMBER', 'ENTER BUS REG NUMBER', _busRegCtrl),
                  _buildInputCol('BUS CAPACITY (SEATS)', 'ENTER CAPACITY', _busCapCtrl),
                  _buildInputCol('ROUTE NAME', 'ENTER ROUTE NAME', _routeCtrl),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('STARTING POINT', 'ENTER STARTING POINT', _startCtrl),
                  _buildDropdownCol('DESTINATION (UNIVERSITY)', 'SELECT UNIVERSITY', ['Colombo', 'Peradeniya', 'Moratuwa'], _destination, (v) => setState(() => _destination = v)),
                  _buildInputCol('MONTHLY FEE (LKR)', 'ENTER MONTHLY FEE', _feeCtrl),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                _buildSectionTitle('SCHEDULE'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('SCHEDULE TYPE', 'WEEKLY (MON - FRI)', ['Weekly (Mon-Fri)', 'Weekend Only', 'Everyday'], _scheduleType, (v) => setState(() => _scheduleType = v)),
                  Expanded(
                    flex: 2,
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.white.withOpacity(0.2))),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('WEEKDAY (MON - FRI)', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(child: _buildTimePickerCol('PICKUP TIME', _pickupTime, () => _selectTime(context, true))),
                              const SizedBox(width: 20),
                              Expanded(child: _buildTimePickerCol('DROP TIME', _dropTime, () => _selectTime(context, false))),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                ]),

                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),

                _buildSectionTitle('DOCUMENTS UPLOAD'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildUploadCol('NIC COPY', 'UPLOAD', _nicCopy, () => _pickImage('nic')),
                  _buildUploadCol('DRIVING LICENSE COPY', 'UPLOAD', _licenseCopy, () => _pickImage('license')),
                  _buildUploadCol('VEHICLE REGISTRATION COPY', 'UPLOAD', _vehicleReg, () => _pickImage('vehicle')),
                  _buildUploadCol('BUS PHOTO', 'UPLOAD', _busPhoto, () => _pickImage('bus')),
                ]),

                const SizedBox(height: 50),
                
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 50,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white54, width: 1), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25))),
                          onPressed: () => Navigator.pop(context),
                          child: const Text('CANCEL', style: TextStyle(color: Colors.white, letterSpacing: 2, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      flex: 2,
                      child: SizedBox(
                        height: 50,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25), side: const BorderSide(color: Colors.white30))),
                          onPressed: _isLoading ? null : _register,
                          child: _isLoading 
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text('SUBMIT REGISTRATION', style: TextStyle(color: Colors.white, letterSpacing: 2, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ],
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
          if (child is Expanded) return Padding(padding: const EdgeInsets.only(bottom: 20.0), child: child.child);
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
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.2))),
          child: TextFormField(
            controller: controller,
            obscureText: obscureText,
            style: const TextStyle(color: Colors.black, fontSize: 12),
            decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: Colors.black54, fontSize: 10), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15)),
            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
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

  Widget _buildTimePickerCol(String label, TimeOfDay? time, VoidCallback onTap) {
    final hint = time == null ? 'SELECT TIME' : time.format(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.2))),
            child: Row(
              children: [
                const Icon(Icons.access_time, color: Colors.white54, size: 16),
                const SizedBox(width: 10),
                Text(hint, style: const TextStyle(color: Colors.white, fontSize: 12)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadCol(String label, String subtext, XFile? file, VoidCallback onTap) {
    final bool isSelected = file != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 100,
            decoration: BoxDecoration(
              color: isSelected ? Colors.transparent : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.white.withOpacity(0.3), style: BorderStyle.solid),
              image: isSelected 
                  ? DecorationImage(
                      image: kIsWeb
                          ? NetworkImage(file.path) as ImageProvider
                          : FileImage(File(file.path)),
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
                        const Icon(Icons.cloud_upload_outlined, color: Colors.white, size: 24),
                        const SizedBox(height: 4),
                        Text(subtext, style: const TextStyle(color: Colors.white, fontSize: 10)),
                        const SizedBox(height: 2),
                        const Text('JPG, PNG (MAX 2MB)', style: const TextStyle(color: Colors.white54, fontSize: 8)),
                      ],
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
