import 'package:flutter/material.dart';
import '../utils/lang.dart';
import '../utils/palette.dart';

/// Opens a short menu to choose English or Sinhala. Each language is written
/// in itself, so anyone can find theirs.
class LanguageButton extends StatelessWidget {
  const LanguageButton({super.key});

  static const _options = [(AppLang.en, 'English'), (AppLang.si, 'සිංහල')];

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
                child: Text('LANGUAGE / භාෂාව', style: TextStyle(color: pal.fg54, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              ),
              for (final (lang, label) in _options)
                ListTile(
                  leading: Icon(Icons.translate, color: pal.fg),
                  title: Text(label, style: TextStyle(color: pal.fg, fontWeight: FontWeight.w600)),
                  trailing: LangController.lang.value == lang ? Icon(Icons.check_circle, color: pal.green) : null,
                  onTap: () {
                    Navigator.pop(sheetContext);
                    LangController.set(lang);
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
    return IconButton(
      tooltip: 'Language / භාෂාව',
      icon: Icon(Icons.translate, color: context.pal.fg),
      onPressed: () => _choose(context),
    );
  }
}
