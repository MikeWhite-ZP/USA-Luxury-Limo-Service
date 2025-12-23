class Invoice {
  final int id;
  final String invoiceNumber;
  final int bookingId;
  final double totalAmount;
  final DateTime? paidAt;
  final DateTime createdAt;
  final Booking? booking;

  const Invoice({
    required this.id,
    required this.invoiceNumber,
    required this.bookingId,
    required this.totalAmount,
    this.paidAt,
    required this.createdAt,
    this.booking,
  });

  bool get isPaid => paidAt != null;
  String get statusLabel => isPaid ? 'Paid' : 'Unpaid';

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'] as int,
      invoiceNumber: json['invoiceNumber'] as String,
      bookingId: json['bookingId'] as int,
      totalAmount: double.parse(json['totalAmount'].toString()),
      paidAt: json['paidAt'] != null 
        ? DateTime.parse(json['paidAt'] as String) 
        : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      booking: json['booking'] != null 
        ? Booking.fromJson(json['booking'] as Map<String, dynamic>) 
        : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'invoiceNumber': invoiceNumber,
    'bookingId': bookingId,
    'totalAmount': totalAmount,
    'paidAt': paidAt?.toIso8601String(),
    'createdAt': createdAt.toIso8601String(),
    'booking': booking?.toJson(),
  };
}

class Booking {
  final int id;
  final String confirmationNumber;
  final String status;
  final String pickupAddress;
  final String? destinationAddress;
  final DateTime scheduledDateTime;

  const Booking({
    required this.id,
    required this.confirmationNumber,
    required this.status,
    required this.pickupAddress,
    this.destinationAddress,
    required this.scheduledDateTime,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as int,
      confirmationNumber: json['confirmationNumber'] as String,
      status: json['status'] as String,
      pickupAddress: json['pickupAddress'] as String,
      destinationAddress: json['destinationAddress'] as String?,
      scheduledDateTime: DateTime.parse(json['scheduledDateTime'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'confirmationNumber': confirmationNumber,
    'status': status,
    'pickupAddress': pickupAddress,
    'destinationAddress': destinationAddress,
    'scheduledDateTime': scheduledDateTime.toIso8601String(),
  };
}
