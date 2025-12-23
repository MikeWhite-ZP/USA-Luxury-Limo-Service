class ApiEndpoints {
  final String baseUrl;

  const ApiEndpoints(this.baseUrl);

  String get branding => '$baseUrl/api/branding';
  
  String get login => '$baseUrl/api/auth/login';
  String get register => '$baseUrl/api/auth/register';
  String get logout => '$baseUrl/api/auth/logout';
  String get currentUser => '$baseUrl/api/auth/user';
  String get checkUsername => '$baseUrl/api/auth/check-username';
  
  String get passengerDashboard => '$baseUrl/api/passenger/dashboard';
  String get passengerBookings => '$baseUrl/api/passenger/bookings';
  String get passengerInvoices => '$baseUrl/api/passenger/invoices';
  String get passengerLocations => '$baseUrl/api/passenger/saved-locations';
  String get passengerProfile => '$baseUrl/api/passenger/profile';
  
  String get driverDashboard => '$baseUrl/api/driver/dashboard';
  String get driverJobs => '$baseUrl/api/driver/jobs';
  String get driverLocation => '$baseUrl/api/driver/location';
  String get driverStatus => '$baseUrl/api/driver/status';
  
  String get adminDashboard => '$baseUrl/api/admin/dashboard';
  String get adminBookings => '$baseUrl/api/admin/bookings';
  String get adminUsers => '$baseUrl/api/admin/users';
  String get adminDrivers => '$baseUrl/api/admin/drivers';
  String get adminVehicles => '$baseUrl/api/admin/vehicles';
  String get adminSettings => '$baseUrl/api/admin/settings';
  
  String get vehicleTypes => '$baseUrl/api/vehicle-types';
  String get pricing => '$baseUrl/api/pricing/calculate';
  
  String get geocode => '$baseUrl/api/geocode';
  String get flightSearch => '$baseUrl/api/flights/search';
  
  String bookingDetails(String id) => '$baseUrl/api/bookings/$id';
  String invoiceDetails(String id) => '$baseUrl/api/invoices/$id';
  String invoiceEmail(String id) => '$baseUrl/api/passenger/invoices/$id/email';
}
