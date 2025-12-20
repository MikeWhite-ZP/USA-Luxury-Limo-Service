import 'package:equatable/equatable.dart';
import 'package:usa_luxury_limo/shared/models/vehicle_model.dart';

enum BookingStatus {
  pending,
  confirmed,
  assigned,
  inProgress,
  completed,
  cancelled;

  String get displayName {
    switch (this) {
      case BookingStatus.pending:
        return 'Pending';
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.assigned:
        return 'Driver Assigned';
      case BookingStatus.inProgress:
        return 'In Progress';
      case BookingStatus.completed:
        return 'Completed';
      case BookingStatus.cancelled:
        return 'Cancelled';
    }
  }

  static BookingStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return BookingStatus.pending;
      case 'confirmed':
        return BookingStatus.confirmed;
      case 'assigned':
        return BookingStatus.assigned;
      case 'in_progress':
      case 'inprogress':
        return BookingStatus.inProgress;
      case 'completed':
        return BookingStatus.completed;
      case 'cancelled':
      case 'canceled':
        return BookingStatus.cancelled;
      default:
        return BookingStatus.pending;
    }
  }
}

class LocationModel extends Equatable {
  final String address;
  final double? latitude;
  final double? longitude;

  const LocationModel({
    required this.address,
    this.latitude,
    this.longitude,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      address: json['address'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  @override
  List<Object?> get props => [address, latitude, longitude];
}

class BookingModel extends Equatable {
  final String id;
  final String? userId;
  final LocationModel pickup;
  final LocationModel dropoff;
  final List<LocationModel>? stops;
  final DateTime scheduledDate;
  final String? vehicleTypeId;
  final VehicleModel? vehicle;
  final int passengers;
  final int luggage;
  final double? estimatedPrice;
  final double? finalPrice;
  final double? distance;
  final int? duration;
  final BookingStatus status;
  final String? notes;
  final String? flightNumber;
  final String? driverId;
  final String? driverName;
  final DateTime? createdAt;

  const BookingModel({
    required this.id,
    this.userId,
    required this.pickup,
    required this.dropoff,
    this.stops,
    required this.scheduledDate,
    this.vehicleTypeId,
    this.vehicle,
    this.passengers = 1,
    this.luggage = 0,
    this.estimatedPrice,
    this.finalPrice,
    this.distance,
    this.duration,
    this.status = BookingStatus.pending,
    this.notes,
    this.flightNumber,
    this.driverId,
    this.driverName,
    this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as String,
      userId: json['userId'] as String?,
      pickup: LocationModel.fromJson(json['pickup'] as Map<String, dynamic>? ?? 
          {'address': json['pickupAddress'] ?? ''}),
      dropoff: LocationModel.fromJson(json['dropoff'] as Map<String, dynamic>? ?? 
          {'address': json['dropoffAddress'] ?? ''}),
      stops: json['stops'] != null
          ? (json['stops'] as List)
              .map((e) => LocationModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      scheduledDate: DateTime.parse(json['scheduledDate'] as String),
      vehicleTypeId: json['vehicleTypeId'] as String?,
      vehicle: json['vehicle'] != null
          ? VehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>)
          : null,
      passengers: json['passengers'] as int? ?? 1,
      luggage: json['luggage'] as int? ?? 0,
      estimatedPrice: (json['estimatedPrice'] as num?)?.toDouble(),
      finalPrice: (json['finalPrice'] as num?)?.toDouble(),
      distance: (json['distance'] as num?)?.toDouble(),
      duration: json['duration'] as int?,
      status: BookingStatus.fromString(json['status'] as String? ?? 'pending'),
      notes: json['notes'] as String?,
      flightNumber: json['flightNumber'] as String?,
      driverId: json['driverId'] as String?,
      driverName: json['driverName'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'pickup': pickup.toJson(),
      'dropoff': dropoff.toJson(),
      'stops': stops?.map((e) => e.toJson()).toList(),
      'scheduledDate': scheduledDate.toIso8601String(),
      'vehicleTypeId': vehicleTypeId,
      'passengers': passengers,
      'luggage': luggage,
      'estimatedPrice': estimatedPrice,
      'finalPrice': finalPrice,
      'distance': distance,
      'duration': duration,
      'status': status.name,
      'notes': notes,
      'flightNumber': flightNumber,
      'driverId': driverId,
      'driverName': driverName,
    };
  }

  double get displayPrice => finalPrice ?? estimatedPrice ?? 0.0;

  @override
  List<Object?> get props => [
        id,
        userId,
        pickup,
        dropoff,
        stops,
        scheduledDate,
        vehicleTypeId,
        vehicle,
        passengers,
        luggage,
        estimatedPrice,
        finalPrice,
        distance,
        duration,
        status,
        notes,
        flightNumber,
        driverId,
        driverName,
        createdAt,
      ];
}
