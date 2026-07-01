import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class DriverTrackingScreen extends StatefulWidget {
  const DriverTrackingScreen({Key? key}) : super(key: key);

  @override
  State<DriverTrackingScreen> createState() => _DriverTrackingScreenState();
}

class _DriverTrackingScreenState extends State<DriverTrackingScreen> with SingleTickerProviderStateMixin {
  bool _isBroadcasting = false;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: 'Chaminda Dias',
      userRole: 'Driver',
      activeIndex: 3, // Assuming 3 is GPS Tracking in sidebar
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'LIVE GPS TRACKING',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            const Text(
              "BROADCAST YOUR LOCATION TO YOUR PASSENGERS",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            // Map and Controls Area
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: Colors.white24, width: 1),
                ),
                child: Stack(
                  children: [
                    // Fake Map Background
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: Container(
                        decoration: const BoxDecoration(
                          image: DecorationImage(
                            image: NetworkImage('https://maps.googleapis.com/maps/api/staticmap?center=Colombo,Sri+Lanka&zoom=13&size=800x600&maptype=roadmap&style=element:geometry%7Ccolor:0x242f3e&style=element:labels.text.stroke%7Ccolor:0x242f3e&style=element:labels.text.fill%7Ccolor:0x746855&key=YOUR_API_KEY_HERE'), // Placeholder styling for dark mode map
                            fit: BoxFit.cover,
                          ),
                          color: Color(0xFF1E2128), // Fallback color
                        ),
                        child: Center(
                          child: _isBroadcasting
                              ? AnimatedBuilder(
                                  animation: _pulseController,
                                  builder: (context, child) {
                                    return Container(
                                      width: 100 + (_pulseController.value * 50),
                                      height: 100 + (_pulseController.value * 50),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.blueAccent.withOpacity(0.2 - (_pulseController.value * 0.1)),
                                        border: Border.all(
                                          color: Colors.blueAccent.withOpacity(0.5 - (_pulseController.value * 0.3)),
                                          width: 2,
                                        ),
                                      ),
                                      child: const Center(
                                        child: Icon(Icons.directions_bus, color: Colors.blueAccent, size: 40),
                                      ),
                                    );
                                  },
                                )
                              : const Icon(Icons.location_off, color: Colors.white54, size: 50),
                        ),
                      ),
                    ),

                    // Controls Panel (Glassmorphic)
                    Positioned(
                      bottom: 30,
                      left: 30,
                      right: 30,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _isBroadcasting ? 'BROADCASTING LIVE' : 'LOCATION SHARING OFF',
                                      style: TextStyle(
                                        color: _isBroadcasting ? Colors.blueAccent : Colors.white70,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 5),
                                    Text(
                                      _isBroadcasting ? '28 passengers are tracking you.' : 'Turn on to let students see your ETA.',
                                      style: const TextStyle(color: Colors.white54, fontSize: 14),
                                    ),
                                  ],
                                ),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _isBroadcasting ? Colors.redAccent : Colors.white,
                                    foregroundColor: _isBroadcasting ? Colors.white : Colors.black,
                                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _isBroadcasting = !_isBroadcasting;
                                    });
                                  },
                                  child: Row(
                                    children: [
                                      Icon(_isBroadcasting ? Icons.stop : Icons.play_arrow, size: 20),
                                      const SizedBox(width: 8),
                                      Text(
                                        _isBroadcasting ? 'STOP SHARING' : 'START LIVE LOCATION',
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
