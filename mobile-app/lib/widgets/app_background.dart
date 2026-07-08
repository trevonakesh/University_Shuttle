import 'package:flutter/material.dart';

/// Shared full-screen background: remote photo with a dark overlay,
/// falling back to a plain dark gradient when the image cannot load
/// (offline, blocked, etc.).
class AppBackground extends StatelessWidget {
  final double overlayOpacity;

  const AppBackground({Key? key, this.overlayOpacity = 0.75}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1B2735), Color(0xFF090A0F)],
            ),
          ),
        ),
        Image.network(
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1920&auto=format&fit=crop',
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
          loadingBuilder: (context, child, progress) =>
              progress == null ? child : const SizedBox.shrink(),
        ),
        Container(
          color: Colors.black.withOpacity(overlayOpacity),
        ),
      ],
    );
  }
}
