import 'package:flutter/material.dart';
import '../utils/palette.dart';

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
                Text(field['label'].toString().toUpperCase(), style: TextStyle(color: context.pal.fg70, fontSize: 10, letterSpacing: 1)),
                const SizedBox(height: 8),
                field['type'] == 'select' ? _dropdown(context, field) : _input(context, field),
              ],
            ),
          ),
      ],
    );
  }

  String? _validate(dynamic field, String? value) =>
      field['required'] == true && (value == null || value.trim().isEmpty) ? 'Required' : null;

  Widget _input(BuildContext context, dynamic field) {
    final keyboard = switch (field['type']) {
      'number' => const TextInputType.numberWithOptions(decimal: true, signed: true),
      'phone' => TextInputType.phone,
      _ => TextInputType.text,
    };
    return Container(
      decoration: BoxDecoration(color: context.pal.tint(0.9), borderRadius: BorderRadius.circular(20)),
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

  Widget _dropdown(BuildContext context, dynamic field) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(color: context.pal.tint(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: context.pal.tint(0.2))),
      child: DropdownButtonFormField<String>(
        isExpanded: true,
        initialValue: answers[field['key']],
        hint: Text('SELECT', style: TextStyle(color: context.pal.fg54, fontSize: 10)),
        dropdownColor: context.pal.surface,
        icon: Icon(Icons.keyboard_arrow_down, color: context.pal.fg54, size: 16),
        decoration: const InputDecoration(border: InputBorder.none),
        items: [
          for (final option in List<String>.from(field['options'] ?? const []))
            DropdownMenuItem(value: option, child: Text(option, style: TextStyle(color: context.pal.fg))),
        ],
        validator: (value) => _validate(field, value),
        onChanged: (value) => answers[field['key']] = value ?? '',
      ),
    );
  }
}
