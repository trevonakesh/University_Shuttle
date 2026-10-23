import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/app_background.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../services/api_service.dart';
import '../driver/driver_dashboard.dart';
import 'login_screen.dart';

class DriverPendingScreen extends StatefulWidget {
  const DriverPendingScreen({Key? key}) : super(key: key);

  @override
  State<DriverPendingScreen> createState() => _DriverPendingScreenState();
}

class _DriverPendingScreenState extends State<DriverPendingScreen> {
  IO.Socket? _socket;
  String _driverId = '';
  
  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  Future<void> _initSocket() async {
    final user = await ApiService.getUser();
    if (user != null && user['profile'] != null) {
      _driverId = user['profile']['id'].toString();
      
      _socket = await ApiService.createSocket();
      if (!mounted) {
        _socket!.dispose();
        return;
      }

      _socket!.connect();

      _socket!.onConnect((_) {
        print('Connected to Socket.IO server for status updates');
        _socket!.emit('joinStatusRoom', _driverId);
      });

      _socket!.on('driver_status_updated', (data) async {
        if (!mounted) return;
        
        final status = data['status'];
        if (status == 'APPROVED') {
          // Update local user data
          final userStr = await ApiService.getUser();
          if (userStr != null) {
            if (userStr['profile'] != null) {
              userStr['profile']['status'] = 'APPROVED';
            } else if (userStr['driver'] != null) {
              userStr['driver']['status'] = 'APPROVED';
            }
            final role = await ApiService.getRole() ?? 'DRIVER';
            final token = await ApiService.getToken() ?? '';
            await ApiService.saveToken(token, role, userStr);
          }
          
          if (!mounted) return;
          // Nav to dashboard
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const DriverDashboardScreen()),
            (route) => false,
          );
        } else if (status == 'REJECTED') {
          ApiService.logout(); // Clear token
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Your application was rejected by the admin.'),
              backgroundColor: Colors.red,
            ),
          );
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (route) => false,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
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
              child: Padding(
                padding: const EdgeInsets.all(30.0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                    child: Container(
                      padding: const EdgeInsets.all(40),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.hourglass_empty,
                            color: Colors.white,
                            size: 60,
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'UNDER REVIEW',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 15),
                          const Text(
                            'Your application is currently being reviewed by our admin team. This screen will automatically update once your account is approved.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white70,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 30),
                          const CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                          const SizedBox(height: 30),
                          TextButton(
                            onPressed: () async {
                              await ApiService.logout();
                              if (!mounted) return;
                              Navigator.pushAndRemoveUntil(
                                context,
                                MaterialPageRoute(builder: (_) => const LoginScreen()),
                                (route) => false,
                              );
                            },
                            child: const Text(
                              'LOGOUT',
                              style: TextStyle(
                                color: Colors.white54,
                                letterSpacing: 1,
                              ),
                            ),
                          )
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
}
