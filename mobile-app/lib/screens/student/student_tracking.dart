import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/dashboard_layout.dart';

class StudentTrackingScreen extends StatelessWidget {
  const StudentTrackingScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DashboardLayout(
      userName: 'Supun Perera',
      userRole: 'Student',
      activeIndex: 3, // Assuming 3 is Tracking
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'LIVE BUS TRACKING',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 5),
            const Text(
              "TRACK YOUR BUS IN REAL-TIME AND VIEW ETA",
              style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1),
            ),
            const SizedBox(height: 40),

            // Map and Info Area
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
                            image: NetworkImage('https://maps.googleapis.com/maps/api/staticmap?center=Colombo,Sri+Lanka&zoom=13&size=800x600&maptype=roadmap&style=element:geometry%7Ccolor:0x242f3e&style=element:labels.text.stroke%7Ccolor:0x242f3e&style=element:labels.text.fill%7Ccolor:0x746855&key=YOUR_API_KEY_HERE'),
                            fit: BoxFit.cover,
                          ),
                          color: Color(0xFF1E2128),
                        ),
                        child: Stack(
                          children: [
                            // Mock Bus Marker
                            Positioned(
                              top: 200,
                              left: 300,
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: const BoxDecoration(
                                  color: Colors.blueAccent,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(color: Colors.blueAccent, blurRadius: 20, spreadRadius: 5),
                                  ],
                                ),
                                child: const Icon(Icons.directions_bus, color: Colors.white, size: 24),
                              ),
                            ),
                            // Mock Student Location Marker
                            Positioned(
                              top: 400,
                              left: 450,
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: const BoxDecoration(
                                      color: Colors.green,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 20),
                                  ),
                                  const SizedBox(height: 5),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.black87,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Text('Your Pickup Point', style: TextStyle(color: Colors.white, fontSize: 10)),
                                  ),
                                ],
                              ),
                            ),
                            // Mock Route Line
                            Positioned(
                              top: 230,
                              left: 320,
                              child: CustomPaint(
                                size: const Size(130, 170),
                                painter: _DashedLinePainter(),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ETA Glassmorphic Panel
                    Positioned(
                      bottom: 30,
                      left: 30,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            width: 350,
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      backgroundColor: Colors.white12,
                                      radius: 20,
                                      child: Icon(Icons.directions_bus, color: Colors.white, size: 20),
                                    ),
                                    const SizedBox(width: 15),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: const [
                                        Text('Chaminda Dias', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                                        Text('WP ND-8923', style: TextStyle(color: Colors.white54, fontSize: 12)),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 25),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildEtaStat('ETA', '12 MINS', Colors.blueAccent),
                                    _buildEtaStat('DISTANCE', '4.2 KM', Colors.green),
                                    _buildEtaStat('SPEED', '35 KM/H', Colors.orange),
                                  ],
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

  Widget _buildEtaStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
        const SizedBox(height: 5),
        Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blueAccent
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    
    final path = Path();
    path.moveTo(0, 0);
    path.quadraticBezierTo(size.width * 0.8, size.height * 0.2, size.width, size.height);

    const dashWidth = 8.0;
    const dashSpace = 6.0;
    double distance = 0.0;
    
    for (var metric in path.computeMetrics()) {
      while (distance < metric.length) {
        final pathSegment = metric.extractPath(distance, distance + dashWidth);
        canvas.drawPath(pathSegment, paint);
        distance += dashWidth + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
