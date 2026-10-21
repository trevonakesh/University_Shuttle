import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/app_background.dart';
import 'student_register_screen.dart';
import 'driver_register_screen.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 800;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const AppBackground(overlayOpacity: 0.6),
          
          // Main Content
          SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'CHOOSE YOUR ROLE',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'SELECT HOW YOU WANT TO CONTINUE',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                            letterSpacing: 1.2,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 60),
                        
                        // Cards Layout
                        if (isDesktop)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Expanded(
                                child: _buildRoleCard(
                                  context: context,
                                  icon: Icons.school_outlined,
                                  title: 'STUDENT',
                                  description: 'FIND BUSES. REQUEST SEATS.\nTRACK AND MANAGE YOUR TRAVEL.',
                                  buttonText: 'CONTINUE AS STUDENT',
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) => const StudentRegisterScreen()),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(width: 40),
                              Expanded(
                                child: _buildRoleCard(
                                  context: context,
                                  icon: Icons.directions_bus_outlined,
                                  title: 'DRIVER',
                                  description: 'MANAGE YOUR BUS, PASSENGERS,\nPOLLS, PAYMENTS AND MORE.',
                                  buttonText: 'CONTINUE AS DRIVER',
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) => const DriverRegisterScreen()),
                                    );
                                  },
                                ),
                              ),
                            ],
                          )
                        else
                          Column(
                            children: [
                              _buildRoleCard(
                                context: context,
                                icon: Icons.school_outlined,
                                title: 'STUDENT',
                                description: 'FIND BUSES. REQUEST SEATS.\nTRACK AND MANAGE YOUR TRAVEL.',
                                buttonText: 'CONTINUE AS STUDENT',
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const StudentRegisterScreen()),
                                  );
                                },
                              ),
                              const SizedBox(height: 30),
                              _buildRoleCard(
                                context: context,
                                icon: Icons.directions_bus_outlined,
                                title: 'DRIVER',
                                description: 'MANAGE YOUR BUS, PASSENGERS,\nPOLLS, PAYMENTS AND MORE.',
                                buttonText: 'CONTINUE AS DRIVER',
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const DriverRegisterScreen()),
                                  );
                                },
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Back Button
          Positioned(
            top: 40,
            left: 16,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String description,
    required String buttonText,
    required VoidCallback onPressed,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 50),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 1.5,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 100,
                color: Colors.white,
              ),
              const SizedBox(height: 30),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.white70,
                  height: 1.5,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Colors.white24),
                    ),
                  ),
                  onPressed: onPressed,
                  child: Text(
                    buttonText,
                    style: const TextStyle(
                      color: Colors.white,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
