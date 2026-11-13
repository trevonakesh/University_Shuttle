import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../utils/palette.dart';

import '../utils/lang.dart';
/// Opens a short menu to choose light, dark, or following the phone's setting.
class ThemeModeButton extends StatelessWidget {
  const ThemeModeButton({super.key});

  static const _options = [
    (ThemeMode.system, Icons.brightness_auto_outlined, 'Same as phone'),
    (ThemeMode.light, Icons.light_mode_outlined, 'Light'),
    (ThemeMode.dark, Icons.dark_mode_outlined, 'Dark'),
  ];

  void _choose(BuildContext context) {
    final pal = context.pal;
    showModalBottomSheet(
      context: context,
      backgroundColor: pal.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                child: Text(tr('APPEARANCE'), style: TextStyle(color: pal.fg54, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              ),
              for (final (mode, icon, label) in _options)
                ListTile(
                  leading: Icon(icon, color: pal.fg),
                  title: Text(tr(label), style: TextStyle(color: pal.fg, fontWeight: FontWeight.w600)),
                  trailing: ThemeController.mode.value == mode ? Icon(Icons.check_circle, color: pal.green) : null,
                  onTap: () {
                    ThemeController.set(mode);
                    Navigator.pop(sheetContext);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return IconButton(
      tooltip: tr('Light or dark mode'),
      icon: Icon(isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined, color: context.pal.fg),
      onPressed: () => _choose(context),
    );
  }
}
