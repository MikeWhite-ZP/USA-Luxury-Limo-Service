class Booking {
  final int id;
  final String confirmationNumber;
  final String status;
  final String bookingType;
  final DateTime scheduledDateTime;
  final String pickupAddress;
  final String? destinationAddress;
  final double? pickupLat;
  final double? pickupLng;
  final double? destinationLat;
  final double? destinationLng;
  final int passengerCount;
  final String? vehicleType;
  final String? vehicleTypeName;
  final String? vehicleName;
  final String? driverName;
  final String? driverPhone;
  final double? totalFare;
  final double? baseFare;
  final double? gratuityAmount;
  final String? paymentMethod;
  final String? notes;
  final String? specialInstructions;
  final String? flightNumber;
  final String? airline;
  final DateTime? createdAt;

  const Booking({
    required this.id,
    required this.confirmationNumber,
    required this.status,
    required this.bookingType,
    required this.scheduledDateTime,
    required this.pickupAddress,
    this.destinationAddress,
    this.pickupLat,
    this.pickupLng,
    this.destinationLat,
    this.destinationLng,
    required this.passengerCount,
    this.vehicleType,
    this.vehicleTypeName,
    this.vehicleName,
    this.driverName,
    this.driverPhone,
    this.totalFare,
    this.baseFare,
    this.gratuityAmount,
    this.paymentMethod,
    this.notes,
    this.specialInstructions,
    this.flightNumber,
    this.airline,
    this.createdAt,
  });

  bool get isUpcoming => 
    status == 'pending' || 
    status == 'confirmed' || 
    status == 'assigned' ||
    status == 'en_route';

  bool get isActive => 
    status == 'in_progress' || 
    status == 'arrived' ||
    status == 'picked_up';

  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';

  String get statusLabel {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'assigned': return 'Driver Assigned';
      case 'en_route': return 'Driver En Route';
      case 'arrived': return 'Driver Arrived';
      case 'picked_up': return 'In Progress';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as int,
      confirmationNumber: json['confirmationNumber'] as String,
      status: json['status'] as String,
      bookingType: json['bookingType'] as String? ?? 'point_to_point',
      scheduledDateTime: DateTime.parse(json['scheduledDateTime'] as String),
      pickupAddress: json['pickupAddress'] as String,
      destinationAddress: json['destinationAddress'] as String?,
      pickupLat: (json['pickupLat'] as num?)?.toDouble(),
      pickupLng: (json['pickupLng'] as num?)?.toDouble(),
      destinationLat: (json['destinationLat'] as num?)?.toDouble(),
      destinationLng: (json['destinationLng'] as num?)?.toDouble(),
      passengerCount: json['passengerCount'] as int? ?? 1,
      vehicleType: json['vehicleType'] as String?,
      vehicleTypeName: json['vehicleTypeName'] as String?,
      vehicleName: json['vehicleName'] as String?,
      driverName: json['driverName'] as String?,
      driverPhone: json['driverPhone'] as String?,
      totalFare: (json['totalFare'] as num?)?.toDouble(),
      baseFare: (json['baseFare'] as num?)?.toDouble(),
      gratuityAmount: (json['gratuityAmount'] as num?)?.toDouble(),
      paymentMethod: json['paymentMethod'] as String?,
      notes: json['notes'] as String?,
      specialInstructions: json['specialInstructions'] as String?,
      flightNumber: json['flightNumber'] as String?,
      airline: json['airline'] as String?,
      createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt'] as String) 
        : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'confirmationNumber': confirmationNumber,
    'status': status,
    'bookingType': bookingType,
    'scheduledDateTime': scheduledDateTime.toIso8601String(),
    'pickupAddress': pickupAddress,
    'destinationAddress': destinationAddress,
    'pickupLat': pickupLat,
    'pickupLng': pickupLng,
    'destinationLat': destinationLat,
    'destinationLng': destinationLng,
    'passengerCount': passengerCount,
    'vehicleType': vehicleType,
    'vehicleTypeName': vehicleTypeName,
    'vehicleName': vehicleName,
    'driverName': driverName,
    'driverPhone': driverPhone,
    'totalFare': totalFare,
    'baseFare': baseFare,
    'gratuityAmount': gratuityAmount,
    'paymentMethod': paymentMethod,
    'notes': notes,
    'specialInstructions': specialInstructions,
    'flightNumber': flightNumber,
    'airline': airline,
    'createdAt': createdAt?.toIso8601String(),
  };
}
