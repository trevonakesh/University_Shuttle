import 'package:flutter/material.dart';

// The fields an admin added to a sign-up form. Answers are written into
// [answers] by field key, and the surrounding Form validates required ones.
class CustomSignupFields extends StatelessWidget {
  final List<dynamic> fields;
  final Map<String, String> answers;

  const CustomSignupFields({super.key, required this.fields, required this.answers});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final field in fields)
          Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(field['label'].toString().toUpperCase(), style: const TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
                const SizedBox(height: 8),
                field['type'] == 'select' ? _dropdown(field) : _input(field),
              ],
            ),
          ),
      ],
    );
  }

  String? _validate(dynamic field, String? value) =>
      field['required'] == true && (value == null || value.trim().isEmpty) ? 'Required' : null;

  Widget _input(dynamic field) {
    final keyboard = switch (field['type']) {
      'number' => const TextInputType.numberWithOptions(decimal: true, signed: true),
      'phone' => TextInputType.phone,
      _ => TextInputType.text,
    };
    return Container(
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(20)),
      child: TextFormField(
        initialValue: answers[field['key']],
        keyboardType: keyboard,
        maxLength: 500,
        style: const TextStyle(color: Colors.black, fontSize: 12),
        decoration: const InputDecoration(border: InputBorder.none, counterText: '', contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 15)),
        validator: (value) => _validate(field, value),
        onChanged: (value) => answers[field['key']] = value,
      ),
    );
  }

  Widget _dropdown(dynamic field) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withValues(alpha: 0.2))),
      child: DropdownButtonFormField<String>(
        isExpanded: true,
        initialValue: answers[field['key']],
        hint: const Text('SELECT', style: TextStyle(color: Colors.white54, fontSize: 10)),
        dropdownColor: Colors.grey.shade900,
        icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 16),
        decoration: const InputDecoration(border: InputBorder.none),
        items: [
          for (final option in List<String>.from(field['options'] ?? const []))
            DropdownMenuItem(value: option, child: Text(option, style: const TextStyle(color: Colors.white))),
        ],
        validator: (value) => _validate(field, value),
        onChanged: (value) => answers[field['key']] = value ?? '',
      ),
    );
  }
}
