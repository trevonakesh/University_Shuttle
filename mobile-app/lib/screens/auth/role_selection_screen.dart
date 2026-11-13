import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/theme_mode_button.dart';
import '../../widgets/language_button.dart';
import '../../utils/palette.dart';
import '../../widgets/app_background.dart';
import 'student_register_screen.dart';
import 'driver_register_screen.dart';

import '../../utils/lang.dart';
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
                        Text(
                          tr('CHOOSE YOUR ROLE'),
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: context.pal.fg,
                            letterSpacing: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          tr('SELECT HOW YOU WANT TO CONTINUE'),
                          style: TextStyle(
                            fontSize: 12,
                            color: context.pal.fg70,
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
                                  title: tr('STUDENT'),
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
                                  title: tr('DRIVER'),
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
                                title: tr('STUDENT'),
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
                                title: tr('DRIVER'),
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
              icon: Icon(Icons.arrow_back, color: context.pal.fg),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          const Positioned(top: 0, right: 0, child: SafeArea(child: Padding(padding: EdgeInsets.all(8), child: Row(mainAxisSize: MainAxisSize.min, children: [LanguageButton(), ThemeModeButton()])))),
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
            color: context.pal.tint(0.15),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: context.pal.tint(0.2),
              width: 1.5,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 100,
                color: context.pal.fg,
              ),
              const SizedBox(height: 30),
              Text(
                tr(title),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: context.pal.fg,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                tr(description),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: context.pal.fg70,
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
                    backgroundColor: context.pal.btn,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: context.pal.fg24),
                    ),
                  ),
                  onPressed: onPressed,
                  child: Text(
                    tr(buttonText),
                    style: TextStyle(
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
