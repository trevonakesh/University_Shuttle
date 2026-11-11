import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
class ApiService {
  // The live server by default. For a local backend, run with
  // --dart-define=API_ORIGIN=http://localhost:5000 (10.0.2.2 on an Android emulator).
  static const String origin = String.fromEnvironment('API_ORIGIN', defaultValue: 'https://api.unishuttle.lk');
  static String get baseUrl => '$origin/api';

  // Whether online payments are open. Refreshed from every getMyFare().
  static bool onlinePayments = false;

  // Converts a backend-relative path (e.g. /uploads/x.jpg) to an absolute URL.
  static String? resolveUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    return '$origin$path';
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

  // Socket.IO connection to the backend, signed in with the saved JWT (the
  // server refuses sockets without one). Not connected yet: call connect()
  // after registering handlers. forceNew stops a cached socket from an
  // earlier login being reused.
  static Future<IO.Socket> createSocket() async {
    final token = await getToken();
    return IO.io(origin, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'forceNew': true,
      'auth': {'token': token ?? ''},
    });
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

  static Future<Map<String, dynamic>?> fetchMe() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['user'] != null) {
          final role = await getRole() ?? 'STUDENT';
          final token = await getToken() ?? '';
          await saveToken(token, role, data['user']);
          return data['user'];
        }
      }
    } catch (e) {
      print('fetchMe error: $e');
    }
    return await getUser();
  }

  // Returns false only when the server explicitly rejects the token (401),
  // so an offline user can still reach their cached session.
  static Future<bool> validateToken() async {
    final token = await getToken();
    if (token == null) return false;
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: await _getHeaders(),
      );
      return response.statusCode != 401;
    } catch (e) {
      return true;
    }
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
        return {'success': false, 'message': data['error'] ?? data['message'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Requests a password-reset code for the given email. In dev (no email
  // provider configured) the backend returns the code in `devCode`.
  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, ...data};
      return {'success': false, 'message': data['error'] ?? 'Request failed'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Step two of a reset: confirms the emailed code and returns a short-lived
  // `resetToken` that the new password is then saved with.
  static Future<Map<String, dynamic>> verifyResetCode(String email, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-reset-code'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'code': code}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, ...data};
      return {'success': false, 'message': data['error'] ?? 'Could not check the code'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Step three. `expired` is true when the confirmed code has timed out and
  // the reset has to start again.
  static Future<Map<String, dynamic>> resetPassword(String resetToken, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'resetToken': resetToken, 'newPassword': newPassword}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, ...data};
      return {'success': false, 'message': data['error'] ?? 'Reset failed', 'expired': data['code'] == 'RESET_EXPIRED'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // The sign-up form as admins set it up: dropdown choices, removed fields and
  // added fields for each role. Null if it can't be loaded.
  static Future<Map<String, dynamic>?> getSignupForm() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/settings/signup-form'));
      if (response.statusCode != 200) return null;
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return null;
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
        return {'success': false, 'message': data['error'] ?? data['message'] ?? 'Registration failed'};
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
        if (data['token'] != null) {
          await saveToken(data['token'], data['user']['role'], data['user']);
        }
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['error'] ?? data['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<String?> uploadImage(XFile imageFile) async {
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload'));
      
      // Get auth headers and add to request if needed
      final headers = await _getHeaders();
      request.headers.addAll(headers);

      final bytes = await imageFile.readAsBytes();
      String filename = imageFile.name.isNotEmpty ? imageFile.name : 'upload.jpg';
      
      request.files.add(http.MultipartFile.fromBytes(
        'image', 
        bytes, 
        filename: filename,
        contentType: MediaType('image', 'jpeg'),
      ));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['url'];
      }
      return null;
    } catch (e) {
      print('Image upload error: $e');
      return null;
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
        return jsonDecode(response.body)['buses'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }



  // --- Request APIs ---
  static Future<Map<String, dynamic>> createSeatRequest(int driverId, {String paymentPlan = 'MONTHLY'}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/requests'),
        headers: await _getHeaders(),
        body: jsonEncode({'driverId': driverId, 'paymentPlan': paymentPlan}),
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
      if (response.statusCode == 200) return jsonDecode(response.body)['requests'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  // The details a driver may edit for a student on their bus, or null on failure.
  static Future<Map<String, dynamic>?> getPassengerDetails(int studentId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/requests/passengers/$studentId'), headers: await _getHeaders());
      if (response.statusCode == 200) return Map<String, dynamic>.from(jsonDecode(response.body)['student']);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updatePassengerDetails(int studentId, Map<String, String> fields) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/requests/passengers/$studentId'),
        headers: await _getHeaders(),
        body: jsonEncode(fields),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'message': data['message']};
      return {'success': false, 'message': data['error'] ?? 'Could not save the changes'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<List<dynamic>> getDriverRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/requests/driver'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) return jsonDecode(response.body)['requests'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  // --- Daily Ride APIs ---
  static Future<Map<String, dynamic>> createDailyRideRequest(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/daily-rides'),
        headers: await _getHeaders(),
        body: jsonEncode(data),
      );
      final resData = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, 'data': resData};
      return {'success': false, 'message': resData['error'] ?? resData['message'] ?? 'Failed to create daily ride'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<List<dynamic>> getDriverDailyRequests({String? date}) async {
    try {
      final uri = Uri.parse('$baseUrl/daily-rides/driver${date != null ? '?date=$date' : ''}');
      final response = await http.get(uri, headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body) ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getStudentDailyRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/daily-rides/student'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) return jsonDecode(response.body) ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> updateDailyRideStatus(int requestId, String status) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/daily-rides/$requestId/status'),
        headers: await _getHeaders(),
        body: jsonEncode({'status': status}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? data['message'] ?? 'Failed to update request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> payDailyRide(int requestId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/daily-rides/$requestId/pay'),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? data['message'] ?? 'Failed to pay for daily ride'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
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

  static Future<bool> deleteSeatRequest(int requestId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/requests/$requestId'),
        headers: await _getHeaders(),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
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

  // The PDF of students coming on a poll, or null if it could not be fetched.
  static Future<Uint8List?> getPassengerListPdf(int pollId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/polls/$pollId/passengers/pdf'), headers: await _getHeaders());
      return response.statusCode == 200 ? response.bodyBytes : null;
    } catch (e) {
      return null;
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

  // Starts a payment for the current month. The server decides the amount.
  // Returns mode DIRECT (settled instantly, dev) or PAYHERE (open checkoutUrl
  // in the browser and poll getPaymentStatus).
  static Future<Map<String, dynamic>> initiatePayment() async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payments/initiate'),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, ...data};
      return {'success': false, 'message': data['error'] ?? 'Failed to start payment'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<String?> getPaymentStatus(int paymentId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/payments/$paymentId/status'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) return jsonDecode(response.body)['status'];
      return null;
    } catch (e) {
      return null;
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
      print('getDriverPayments response: ${response.statusCode} ${response.body}');
      if (response.statusCode == 200) return jsonDecode(response.body)['payments'] ?? [];
      return [];
    } catch (e) {
      print('getDriverPayments error: $e');
      return [];
    }
  }

  // --- Monthly Fare APIs ---
  static Future<Map<String, dynamic>?> getDriverFares({String? month}) async {
    try {
      final uri = Uri.parse('$baseUrl/fares/driver${month != null ? '?month=$month' : ''}');
      final response = await http.get(uri, headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> setFareStatus(int studentId, String month, String status) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/fares/$studentId'),
        headers: await _getHeaders(),
        body: jsonEncode({'month': month, 'status': status}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? 'Failed to update fare status'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>?> getMyFare() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/fares/me'), headers: await _getHeaders());
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        onlinePayments = data['onlinePayments'] == true;
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // --- Payout Request APIs (driver withdrawals) ---
  static Future<Map<String, dynamic>?> getMyPayoutRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/payout-requests/mine'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> requestPayout(double amount, {String? note}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payout-requests'),
        headers: await _getHeaders(),
        body: jsonEncode({'amount': amount, if (note != null && note.isNotEmpty) 'note': note}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 201) return {'success': true, 'data': data};
      return {'success': false, 'message': data['error'] ?? 'Failed to request payout'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> cancelPayoutRequest(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/payout-requests/$id'),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) return {'success': true};
      return {'success': false, 'message': data['error'] ?? 'Failed to cancel'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // --- Notification APIs ---
  static Future<List<dynamic>> getNotifications() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/notifications'), headers: await _getHeaders());
      if (response.statusCode == 200) return jsonDecode(response.body)['notifications'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<bool> markNotificationRead(int id) async {
    try {
      final response = await http.patch(Uri.parse('$baseUrl/notifications/$id/read'), headers: await _getHeaders());
      return response.statusCode == 200;
    } catch (e) {
      return false;
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
