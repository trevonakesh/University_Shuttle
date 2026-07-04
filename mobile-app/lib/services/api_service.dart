import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator connecting to localhost
  // Use localhost for iOS simulator or web
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    } else {
      return 'http://10.0.2.2:3000/api';
    }
  }

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

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
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

  // --- Bus APIs ---
  static Future<List<dynamic>> getAvailableBuses() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/buses'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }



  // --- Request APIs ---
  static Future<Map<String, dynamic>> createSeatRequest(int driverId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/requests'),
        headers: await _getHeaders(),
        body: jsonEncode({'driverId': driverId}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? 'Failed to request seat'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<List<dynamic>> getStudentRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/requests/student'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getDriverRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/requests/driver'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> updateRequestStatus(int requestId, String status) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/requests/$requestId'),
        headers: await _getHeaders(),
        body: jsonEncode({'status': status}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? 'Failed to update request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // --- Poll APIs ---
  static Future<Map<String, dynamic>> createPoll(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/polls'),
        headers: await _getHeaders(),
        body: jsonEncode(data),
      );
      final resData = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, 'data': resData};
      return {'success': false, 'message': resData['error'] ?? 'Failed to create poll'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<List<dynamic>> getDriverPolls() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/polls/driver'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['polls'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getStudentPolls() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/polls/student'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['polls'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> votePoll(int pollId, bool isComing) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/polls/$pollId/vote'),
        headers: await _getHeaders(),
        body: jsonEncode({'isComing': isComing}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? 'Failed to vote'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<bool> deletePoll(int pollId) async {
    try {
      final response = await http.delete(Uri.parse('$baseUrl/polls/$pollId'), headers: await _getHeaders());
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // --- Notice APIs ---
  static Future<Map<String, dynamic>> createNotice(String title, String content) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/notices'),
        headers: await _getHeaders(),
        body: jsonEncode({'title': title, 'content': content}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? 'Failed to create notice'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<List<dynamic>> getDriverNotices() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/notices/driver'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['notices'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getStudentNotices() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/notices/student'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['notices'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<bool> deleteNotice(int noticeId) async {
    try {
      final response = await http.delete(Uri.parse('$baseUrl/notices/$noticeId'), headers: await _getHeaders());
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // --- More Payment APIs ---
  static Future<Map<String, dynamic>> createPayment(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payments'),
        headers: await _getHeaders(),
        body: jsonEncode(data),
      );
      final resData = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, 'data': resData};
      return {'success': false, 'message': resData['error'] ?? 'Failed to create payment'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<List<dynamic>> getStudentPayments() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/payments/student'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['payments'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getDriverPayments() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/payments/driver'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['payments'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<double> getWalletBalance() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/payments/wallet'), headers: await _getHeaders());
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['balance'] ?? 0).toDouble();
      }
      return 0.0;
    } catch (e) {
      return 0.0;
    }
  }
}
