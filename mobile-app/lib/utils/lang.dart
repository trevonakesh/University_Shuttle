import 'dart:ui' show PlatformDispatcher;
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'si_strings.dart';

/// English or Sinhala. The English text is the key: tr('Sign in') gives the
/// Sinhala from [siStrings] when Sinhala is on, and anything missing simply
/// stays in English.
enum AppLang { en, si }

class LangController {
  static const _key = 'app_lang';
  static final ValueNotifier<AppLang> lang = ValueNotifier(AppLang.en);

  /// The saved choice, or the phone's own language the first time.
  static Future<void> load() async {
    String? saved;
    try {
      saved = (await SharedPreferences.getInstance()).getString(_key);
    } catch (_) {}
    lang.value = switch (saved) {
      'si' => AppLang.si,
      'en' => AppLang.en,
      _ => PlatformDispatcher.instance.locale.languageCode == 'si' ? AppLang.si : AppLang.en,
    };
  }

  static Future<void> set(AppLang next) async {
    lang.value = next;
    _redrawEverything();
    try {
      await (await SharedPreferences.getInstance()).setString(_key, next.name);
    } catch (_) {
      // Not saved: the choice still applies until the app closes.
    }
  }

  // Every screen redraws in the new language where it is, keeping what the
  // person has typed and where they are in the app.
  static void _redrawEverything() {
    void mark(Element element) {
      element.markNeedsBuild();
      element.visitChildren(mark);
    }
    WidgetsBinding.instance.rootElement?.visitChildren(mark);
  }
}

/// The text in the chosen language. [vars] fill {name} slots, so the word
/// order can differ between English and Sinhala.
String tr(String text, [Map<String, Object?>? vars]) {
  var out = LangController.lang.value == AppLang.si ? (siStrings[text] ?? text) : text;
  vars?.forEach((key, value) => out = out.replaceAll('{$key}', value?.toString() ?? ''));
  return out;
}
