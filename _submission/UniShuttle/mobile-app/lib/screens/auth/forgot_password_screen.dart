import 'dart:ui';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/app_background.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();

  // 0 = enter email, 1 = enter code + new password
  int _step = 0;
  bool _isLoading = false;
  bool _passwordVisible = false;

  Future<void> _requestCode() async {
    if (_emailController.text.trim().isEmpty) {
      _snack('Please enter your email');
      return;
    }
    setState(() => _isLoading = true);
    final res = await ApiService.forgotPassword(_emailController.text.trim());
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      setState(() => _step = 1);
      // Dev convenience: when no email provider is set, prefill the code.
      if (res['devCode'] != null) {
        _codeController.text = res['devCode'].toString();
        _snack('Dev mode: code auto-filled (${res['devCode']}). In production this is emailed.');
      } else {
        _snack('If an account exists, a reset code was sent to your email.');
      }
    } else {
      _snack(res['message'] ?? 'Something went wrong');
    }
  }

  Future<void> _resetPassword() async {
    if (_codeController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      _snack('Enter the code and a new password');
      return;
    }
    if (_passwordController.text.length < 6) {
      _snack('Password must be at least 6 characters');
      return;
    }
    setState(() => _isLoading = true);
    final res = await ApiService.resetPassword(
      _emailController.text.trim(),
      _codeController.text.trim(),
      _passwordController.text,
    );
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      _snack('Password reset! You can now log in.');
      Navigator.pop(context);
    } else {
      _snack(res['message'] ?? 'Reset failed');
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AppBackground(overlayOpacity: 0.6),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                    child: Container(
                      width: 420,
                      padding: const EdgeInsets.all(40),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.5),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'RESET PASSWORD',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _step == 0
                                ? 'ENTER YOUR EMAIL TO GET A RESET CODE'
                                : 'ENTER THE CODE AND YOUR NEW PASSWORD',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 11, color: Colors.white70, letterSpacing: 1),
                          ),
                          const SizedBox(height: 30),

                          _field(controller: _emailController, hint: 'EMAIL', enabled: _step == 0),

                          if (_step == 1) ...[
                            const SizedBox(height: 16),
                            _field(controller: _codeController, hint: '6-DIGIT CODE', keyboardType: TextInputType.number),
                            const SizedBox(height: 16),
                            _field(
                              controller: _passwordController,
                              hint: 'NEW PASSWORD',
                              obscure: !_passwordVisible,
                              suffix: IconButton(
                                icon: Icon(_passwordVisible ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: Colors.black54),
                                onPressed: () => setState(() => _passwordVisible = !_passwordVisible),
                              ),
                            ),
                          ],

                          const SizedBox(height: 24),
                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: _isLoading ? null : (_step == 0 ? _requestCode : _resetPassword),
                              child: _isLoading
                                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text(
                                      _step == 0 ? 'SEND RESET CODE' : 'RESET PASSWORD',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                                    ),
                            ),
                          ),

                          if (_step == 1)
                            TextButton(
                              onPressed: _isLoading ? null : () => setState(() => _step = 0),
                              child: const Text('CHANGE EMAIL', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            ),

                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('BACK TO LOGIN', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String hint,
    bool obscure = false,
    bool enabled = true,
    TextInputType? keyboardType,
    Widget? suffix,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: enabled ? 0.9 : 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        enabled: enabled,
        keyboardType: keyboardType,
        style: const TextStyle(color: Colors.black),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.black54, fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          suffixIcon: suffix,
        ),
      ),
    );
  }
}
