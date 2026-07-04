import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator connecting to localhost
  // Use localhost for iOS simulator or web
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  static Future<void> saveToken(String token, String role, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    await prefs.setString('user_role', role);
    await prefs.setString('user_data', jsonEncode(user));
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  static Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_role');
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user_data');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        await saveToken(data['token'], data['user']['role'], data['user']);
        return {'success': true, 'role': data['user']['role'], 'data': data};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> studentRegister(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register/student'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201) {
        await saveToken(data['token'], data['user']['role'], data['user']);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> driverRegister(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register/driver'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201) {
        await saveToken(data['token'], data['user']['role'], data['user']);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
