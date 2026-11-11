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
  final _confirmController = TextEditingController();

  // One step at a time: 0 = email, 1 = emailed code, 2 = new password.
  // Step 2 only opens once the server has confirmed the code.
  int _step = 0;
  bool _isLoading = false;
  bool _passwordVisible = false;
  String _resetToken = '';

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

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
      _codeController.clear();
      setState(() => _step = 1);
      _snack('If an account exists, a reset code was sent to your email.');
    } else {
      _snack(res['message'] ?? 'Something went wrong');
    }
  }

  Future<void> _verifyCode() async {
    final code = _codeController.text.replaceAll(RegExp(r'\D'), '');
    if (code.length != 6) {
      _snack('Enter the 6-digit code from the email');
      return;
    }
    setState(() => _isLoading = true);
    final res = await ApiService.verifyResetCode(_emailController.text.trim(), code);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      _resetToken = res['resetToken'].toString();
      setState(() => _step = 2);
    } else {
      _snack(res['message'] ?? 'Could not check the code');
    }
  }

  Future<void> _resetPassword() async {
    final password = _passwordController.text;
    if (password.length < 8 || !RegExp(r'\p{L}', unicode: true).hasMatch(password) || !RegExp(r'\d').hasMatch(password)) {
      _snack('Password needs at least 8 characters, with a letter and a number');
      return;
    }
    if (password != _confirmController.text) {
      _snack("The two passwords don't match");
      return;
    }
    setState(() => _isLoading = true);
    final res = await ApiService.resetPassword(_resetToken, password);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      _snack('Password reset! You can now log in.');
      Navigator.pop(context);
    } else {
      _snack(res['message'] ?? 'Reset failed');
      // The confirmed code is only good for a few minutes; start over if it ran out.
      if (res['expired'] == true) {
        _passwordController.clear();
        _confirmController.clear();
        setState(() => _step = 0);
      }
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
                            'STEP ${_step + 1} OF 3\n${const [
                              'ENTER YOUR EMAIL TO GET A RESET CODE',
                              'ENTER THE CODE WE EMAILED YOU',
                              'CODE CONFIRMED. CHOOSE A NEW PASSWORD',
                            ][_step]}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 11, color: Colors.white70, letterSpacing: 1, height: 1.6),
                          ),
                          const SizedBox(height: 30),

                          if (_step < 2) _field(controller: _emailController, hint: 'EMAIL', enabled: _step == 0, keyboardType: TextInputType.emailAddress),

                          if (_step == 1) ...[
                            const SizedBox(height: 16),
                            _field(controller: _codeController, hint: '6-DIGIT CODE', keyboardType: TextInputType.number),
                            const SizedBox(height: 8),
                            const Text(
                              'ASKED MORE THAN ONCE? ONLY THE NEWEST CODE WORKS.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 10, color: Colors.white70, letterSpacing: 0.5),
                            ),
                          ],

                          if (_step == 2) ...[
                            _field(
                              controller: _passwordController,
                              hint: 'NEW PASSWORD (8+, LETTER AND NUMBER)',
                              obscure: !_passwordVisible,
                              suffix: IconButton(
                                icon: Icon(_passwordVisible ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: Colors.black54),
                                onPressed: () => setState(() => _passwordVisible = !_passwordVisible),
                              ),
                            ),
                            const SizedBox(height: 16),
                            _field(controller: _confirmController, hint: 'TYPE IT AGAIN', obscure: !_passwordVisible),
                          ],

                          const SizedBox(height: 24),
                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: _isLoading ? null : [_requestCode, _verifyCode, _resetPassword][_step],
                              child: _isLoading
                                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text(
                                      const ['SEND RESET CODE', 'VERIFY CODE', 'RESET PASSWORD'][_step],
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                                    ),
                            ),
                          ),

                          if (_step == 1) ...[
                            TextButton(
                              onPressed: _isLoading ? null : _requestCode,
                              child: const Text('SEND A NEW CODE', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            ),
                            TextButton(
                              onPressed: _isLoading ? null : () => setState(() => _step = 0),
                              child: const Text('CHANGE EMAIL', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            ),
                          ],

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
