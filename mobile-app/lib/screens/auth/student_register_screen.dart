import 'package:flutter/material.dart';

class StudentRegisterScreen extends StatefulWidget {
  const StudentRegisterScreen({Key? key}) : super(key: key);

  @override
  State<StudentRegisterScreen> createState() => _StudentRegisterScreenState();
}

class _StudentRegisterScreenState extends State<StudentRegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  // Form fields
  String _fullName = '';
  String _email = '';
  String _phone = '';
  String _password = '';
  String _universityName = '';
  String _nic = '';

  void _register() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      // TODO: Connect to backend API
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Student Registration logic to be integrated')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Student Registration')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Personal Information', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Full Name'),
                onSaved: (val) => _fullName = val ?? '',
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Email Address'),
                keyboardType: TextInputType.emailAddress,
                onSaved: (val) => _email = val ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Phone Number'),
                keyboardType: TextInputType.phone,
                onSaved: (val) => _phone = val ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                onSaved: (val) => _password = val ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'NIC Number'),
                onSaved: (val) => _nic = val ?? '',
              ),
              const SizedBox(height: 32),
              const Text('University Information', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(labelText: 'University Name'),
                onSaved: (val) => _universityName = val ?? '',
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _register,
                child: const Text('Register as Student'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
