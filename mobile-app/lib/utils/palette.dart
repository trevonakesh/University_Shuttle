import 'package:flutter/material.dart';

const Color _ink = Color(0xFF10203A);

/// The app's colours for the current light / dark mode. Screens read it with
/// `context.pal`, so they rebuild when the mode changes.
///
/// The dark set is the app's original look (white text on a dark photo). The
/// light set swaps white for the navy ink used on the website, and turns the
/// see-through white panels into soft white cards.
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
  final bool isDark;
  const AppPalette._(this.isDark);

  static const light = AppPalette._(false);
  static const dark = AppPalette._(true);

  // Main text and icon colour, then fainter steps of it.
  Color get fg => isDark ? Colors.white : _ink;
  Color get fg70 => isDark ? Colors.white70 : _ink.withValues(alpha: 0.78);
  Color get fg54 => isDark ? Colors.white54 : _ink.withValues(alpha: 0.62);
  Color get fg38 => isDark ? Colors.white38 : _ink.withValues(alpha: 0.46);
  Color get fg24 => isDark ? Colors.white24 : _ink.withValues(alpha: 0.18);
  Color get fg12 => isDark ? Colors.white12 : _ink.withValues(alpha: 0.08);

  /// Text on a button or badge filled with [fg].
  Color get onFg => isDark ? Colors.black : Colors.white;

  /// Solid buttons that carry white text in both modes.
  Color get btn => isDark ? Colors.black : _ink;

  Color get bg => isDark ? const Color(0xFF12141D) : const Color(0xFFF3FAF7);
  Color get surface => isDark ? const Color(0xFF1A1A24) : Colors.white;
  Color get bar => isDark ? Colors.black87 : Colors.white.withValues(alpha: 0.96);
  Color get sidebar => isDark ? Colors.black.withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.82);

  // Bright accents read well on dark but not on white, so light mode uses deeper shades.
  Color get green => isDark ? Colors.greenAccent : const Color(0xFF1B8A5A);
  Color get blue => isDark ? Colors.lightBlueAccent : const Color(0xFF1767A1);
  Color get orange => isDark ? Colors.orangeAccent : const Color(0xFFC15F00);

  /// Replaces `Colors.white.withValues(alpha: a)`. In dark mode it is exactly
  /// that. In light mode faint fills become white cards, mid values become
  /// soft navy borders, and near-solid white (input boxes) stays white.
  Color tint(double a) {
    if (isDark) return Colors.white.withValues(alpha: a);
    if (a < 0.18) return Colors.white.withValues(alpha: 0.72 + a);
    if (a < 0.45) return _ink.withValues(alpha: a * 0.6);
    return Colors.white.withValues(alpha: a);
  }

  @override
  AppPalette copyWith() => this;

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) => t < 0.5 || other is! AppPalette ? this : other;
}

extension PaletteContext on BuildContext {
  AppPalette get pal => Theme.of(this).extension<AppPalette>() ?? AppPalette.dark;
}
