import 'package:equatable/equatable.dart';

class VehicleModel extends Equatable {
  final String id;
  final String name;
  final String type;
  final String? description;
  final String? imageUrl;
  final int passengerCapacity;
  final int luggageCapacity;
  final double basePrice;
  final double pricePerMile;
  final double pricePerHour;
  final List<String> features;
  final bool isAvailable;

  const VehicleModel({
    required this.id,
    required this.name,
    required this.type,
    this.description,
    this.imageUrl,
    required this.passengerCapacity,
    required this.luggageCapacity,
    required this.basePrice,
    required this.pricePerMile,
    required this.pricePerHour,
    this.features = const [],
    this.isAvailable = true,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String? ?? json['vehicleType'] as String? ?? '',
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      passengerCapacity: json['passengerCapacity'] as int? ?? json['passengers'] as int? ?? 3,
      luggageCapacity: json['luggageCapacity'] as int? ?? json['luggage'] as int? ?? 2,
      basePrice: (json['basePrice'] as num?)?.toDouble() ?? 0.0,
      pricePerMile: (json['pricePerMile'] as num?)?.toDouble() ?? 0.0,
      pricePerHour: (json['pricePerHour'] as num?)?.toDouble() ?? 0.0,
      features: json['features'] != null
          ? List<String>.from(json['features'] as List)
          : [],
      isAvailable: json['isAvailable'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'description': description,
      'imageUrl': imageUrl,
      'passengerCapacity': passengerCapacity,
      'luggageCapacity': luggageCapacity,
      'basePrice': basePrice,
      'pricePerMile': pricePerMile,
      'pricePerHour': pricePerHour,
      'features': features,
      'isAvailable': isAvailable,
    };
  }

  @override
  List<Object?> get props => [
        id,
        name,
        type,
        description,
        imageUrl,
        passengerCapacity,
        luggageCapacity,
        basePrice,
        pricePerMile,
        pricePerHour,
        features,
        isAvailable,
      ];
}
