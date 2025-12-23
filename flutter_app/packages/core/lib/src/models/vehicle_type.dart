class VehicleType {
  final int id;
  final String name;
  final String? description;
  final int capacity;
  final double basePrice;
  final double pricePerMile;
  final double pricePerMinute;
  final double minimumFare;
  final String? imageUrl;
  final bool isActive;

  const VehicleType({
    required this.id,
    required this.name,
    this.description,
    required this.capacity,
    required this.basePrice,
    required this.pricePerMile,
    required this.pricePerMinute,
    required this.minimumFare,
    this.imageUrl,
    required this.isActive,
  });

  factory VehicleType.fromJson(Map<String, dynamic> json) {
    return VehicleType(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      capacity: json['capacity'] as int? ?? 4,
      basePrice: double.parse(json['basePrice']?.toString() ?? '0'),
      pricePerMile: double.parse(json['pricePerMile']?.toString() ?? '0'),
      pricePerMinute: double.parse(json['pricePerMinute']?.toString() ?? '0'),
      minimumFare: double.parse(json['minimumFare']?.toString() ?? '0'),
      imageUrl: json['imageUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'capacity': capacity,
    'basePrice': basePrice,
    'pricePerMile': pricePerMile,
    'pricePerMinute': pricePerMinute,
    'minimumFare': minimumFare,
    'imageUrl': imageUrl,
    'isActive': isActive,
  };
}
