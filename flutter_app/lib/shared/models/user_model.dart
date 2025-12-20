import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? profileImageUrl;
  final String role;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.phone,
    this.profileImageUrl,
    this.role = 'user',
    this.createdAt,
  });

  String get fullName {
    if (firstName == null && lastName == null) return email;
    return '${firstName ?? ''} ${lastName ?? ''}'.trim();
  }

  String get initials {
    if (firstName != null && lastName != null) {
      return '${firstName![0]}${lastName![0]}'.toUpperCase();
    }
    if (firstName != null) {
      return firstName![0].toUpperCase();
    }
    return email[0].toUpperCase();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      phone: json['phone'] as String?,
      profileImageUrl: json['profileImageUrl'] as String?,
      role: json['role'] as String? ?? 'user',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'profileImageUrl': profileImageUrl,
      'role': role,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? phone,
    String? profileImageUrl,
    String? role,
    DateTime? createdAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      phone: phone ?? this.phone,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [id, email, firstName, lastName, phone, profileImageUrl, role, createdAt];
}
