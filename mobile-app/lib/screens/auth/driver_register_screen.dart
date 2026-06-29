import 'package:flutter/material.dart';

class DriverRegisterScreen extends StatefulWidget {
  const DriverRegisterScreen({Key? key}) : super(key: key);

  @override
  State<DriverRegisterScreen> createState() => _DriverRegisterScreenState();
}

class _DriverRegisterScreenState extends State<DriverRegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  // Form fields
  String _fullName = '';
  String _email = '';
  String _phone = '';
  String _password = '';
  String _nic = '';
  String _licenseNumber = '';
  String _bankName = '';
  String _accNumber = '';

  void _register() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      // TODO: Connect to backend API
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Driver Registration logic to be integrated')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver Registration')),
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
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Driving License Number'),
                onSaved: (val) => _licenseNumber = val ?? '',
              ),
              const SizedBox(height: 32),
              const Text('Banking Information', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Bank Name'),
                onSaved: (val) => _bankName = val ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Account Number'),
                keyboardType: TextInputType.number,
                onSaved: (val) => _accNumber = val ?? '',
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _register,
                child: const Text('Register as Driver'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
