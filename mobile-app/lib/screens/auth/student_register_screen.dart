import 'dart:ui';
import 'package:flutter/material.dart';

class StudentRegisterScreen extends StatefulWidget {
  const StudentRegisterScreen({Key? key}) : super(key: key);

  @override
  State<StudentRegisterScreen> createState() => _StudentRegisterScreenState();
}

class _StudentRegisterScreenState extends State<StudentRegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  void _register() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account Created! (Logic to be integrated)')),
      );
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
          // Background Image with dark overlay
          Image.network(
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=3538&auto=format&fit=crop',
            fit: BoxFit.cover,
          ),
          Container(
            color: Colors.black.withOpacity(0.75), // Darker overlay for form readability
          ),
          
          // Main Content
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
                        // Header
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
                                Text(
                                  'STUDENT REGISTRATION',
                                  style: TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'PLEASE FILL IN YOUR DETAILS TO CREATE YOUR STUDENT ACCOUNT',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.white70,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 30),
                        
                        // Form Card
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
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Personal Information
                _buildSectionTitle('PERSONAL INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('FULL NAME', 'ENTER FULL NAME'),
                  _buildInputCol('NIC NUMBER', 'ENTER NIC NUMBER'),
                  _buildInputCol('STUDENT ID', 'ENTER STUDENT ID'),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('PHONE NUMBER', 'ENTER PHONE NUMBER'),
                  _buildInputCol('EMAIL ADDRESS', 'ENTER EMAIL ADDRESS'),
                  _buildPhotoUploadCol(),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                // 2. University Information
                _buildSectionTitle('UNIVERSITY INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('UNIVERSITY NAME', 'SELECT UNIVERSITY'),
                  _buildDropdownCol('FACULTY', 'SELECT FACULTY'),
                  _buildDropdownCol('DEGREE / PROGRAM', 'SELECT PROGRAM'),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('ACADEMIC YEAR', 'SELECT ACADEMIC YEAR'),
                  _buildInputCol('REGISTRATION NUMBER', 'ENTER REGISTRATION NUMBER'),
                  if (isDesktop) Expanded(child: const SizedBox()), // Empty space for alignment
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                // 3. Travel Information
                _buildSectionTitle('TRAVEL INFORMATION'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('HOME LOCATION', 'ENTER HOME LOCATION'),
                  _buildInputCol('MAIN ROAD / PICKUP POINT', 'ENTER PICKUP POINT'),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildDropdownCol('DESTINATION UNIVERSITY', 'SELECT DESTINATION UNIVERSITY'),
                  if (isDesktop) Expanded(child: const SizedBox()),
                  if (isDesktop) Expanded(child: const SizedBox()),
                ]),
                
                const SizedBox(height: 30),
                const Divider(color: Colors.white24, thickness: 1),
                const SizedBox(height: 30),
                
                // 4. Emergency Contact
                _buildSectionTitle('EMERGENCY CONTACT'),
                const SizedBox(height: 20),
                _buildResponsiveRow(isDesktop, [
                  _buildInputCol('CONTACT PERSON NAME', 'ENTER CONTACT PERSON NAME'),
                  _buildInputCol('PHONE NUMBER', 'ENTER CONTACT PHONE NUMBER'),
                  _buildDropdownCol('RELATIONSHIP', 'SELECT RELATIONSHIP'),
                ]),
                
                const SizedBox(height: 50),
                
                // Create Account Button
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                        side: const BorderSide(color: Colors.white30),
                      ),
                    ),
                    onPressed: _register,
                    child: const Text(
                      'CREATE ACCOUNT',
                      style: TextStyle(
                        color: Colors.white,
                        letterSpacing: 2,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
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
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildResponsiveRow(bool isDesktop, List<Widget> children) {
    if (isDesktop) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children.map((child) {
          if (child is Expanded) return child;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 20.0),
              child: child,
            ),
          );
        }).toList(),
      );
    } else {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children.map((child) {
          if (child is Expanded) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 20.0),
            child: child,
          );
        }).toList(),
      );
    }
  }

  Widget _buildInputCol(String label, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: TextFormField(
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.white54, fontSize: 10),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownCol(String label, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              hint: Text(hint, style: const TextStyle(color: Colors.white54, fontSize: 10)),
              dropdownColor: Colors.grey.shade900,
              icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 16),
              items: const [],
              onChanged: (val) {},
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
        const Text(
          'PROFILE PHOTO',
          style: TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1),
        ),
        const SizedBox(height: 8),
        Container(
          height: 100, // Matching the approximate height of standard inputs + some padding
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.white.withOpacity(0.3), style: BorderStyle.solid),
          ),
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
