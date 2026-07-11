import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// Circular avatar that shows the logged-in user's profile photo, loading it
/// from the cached session so it can be dropped in anywhere without the parent
/// needing to pass the URL. Falls back to a person icon when there is no photo.
class ProfileAvatar extends StatefulWidget {
  final double radius;
  final Color? backgroundColor;

  const ProfileAvatar({Key? key, this.radius = 20, this.backgroundColor}) : super(key: key);

  @override
  State<ProfileAvatar> createState() => _ProfileAvatarState();
}

class _ProfileAvatarState extends State<ProfileAvatar> {
  String? _photoUrl;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final user = await ApiService.getUser();
    final profile = user?['profile'] ?? user?['student'] ?? user?['driver'];
    final resolved = ApiService.resolveUrl(profile?['profilePhotoUrl']);
    if (mounted && resolved != null) {
      setState(() => _photoUrl = resolved);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bg = widget.backgroundColor ?? Colors.white24;
    return CircleAvatar(
      radius: widget.radius,
      backgroundColor: bg,
      backgroundImage: _photoUrl != null ? NetworkImage(_photoUrl!) : null,
      onBackgroundImageError: _photoUrl != null ? (_, __) {} : null,
      child: _photoUrl == null
          ? Icon(Icons.person, color: Colors.white, size: widget.radius * 1.1)
          : null,
    );
  }
}
