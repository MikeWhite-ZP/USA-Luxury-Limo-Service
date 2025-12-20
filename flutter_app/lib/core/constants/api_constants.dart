class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'https://your-api-domain.com';
  
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

  // Auth Endpoints
  static const String login = '/api/login';
  static const String register = '/api/register';
  static const String logout = '/api/logout';
  static const String refreshToken = '/api/auth/refresh';
  static const String user = '/api/user';
  static const String forgotPassword = '/api/forgot-password';

  // Booking Endpoints
  static const String bookings = '/api/bookings';
  static const String bookingById = '/api/bookings/{id}';
  static const String calculatePrice = '/api/calculate-price';
  static const String availableVehicles = '/api/vehicle-types';

  // User Endpoints
  static const String profile = '/api/profile';
  static const String updateProfile = '/api/profile/update';
  static const String uploadProfileImage = '/api/profile/image';

  // Location Endpoints
  static const String geocode = '/api/geocode';
  static const String reverseGeocode = '/api/reverse-geocode';

  // Flight Endpoints
  static const String searchFlights = '/api/flights/search';
  static const String flightDetails = '/api/flights/{id}';

  // Branding
  static const String branding = '/api/branding';
  static const String logo = '/api/site-logo';
}
