class User {
  final int id;
  final String username;
  final String? email;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final String role;
  final String? profileImageUrl;
  final DateTime? createdAt;

  const User({
    required this.id,
    required this.username,
    this.email,
    this.phone,
    this.firstName,
    this.lastName,
    required this.role,
    this.profileImageUrl,
    this.createdAt,
  });

  String get displayName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    if (firstName != null) return firstName!;
    if (lastName != null) return lastName!;
    return username;
  }

  String get initials {
    if (firstName != null && lastName != null) {
      return '${firstName![0]}${lastName![0]}'.toUpperCase();
    }
    if (firstName != null) return firstName![0].toUpperCase();
    if (username.isNotEmpty) return username[0].toUpperCase();
    return '?';
  }

  bool get isPassenger => role == 'passenger';
  bool get isDriver => role == 'driver';
  bool get isDispatcher => role == 'dispatcher';
  bool get isAdmin => role == 'admin';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      username: json['username'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      role: json['role'] as String? ?? 'passenger',
      profileImageUrl: json['profileImageUrl'] as String?,
      createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt'] as String) 
        : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'email': email,
    'phone': phone,
    'firstName': firstName,
    'lastName': lastName,
    'role': role,
    'profileImageUrl': profileImageUrl,
    'createdAt': createdAt?.toIso8601String(),
  };

  User copyWith({
    int? id,
    String? username,
    String? email,
    String? phone,
    String? firstName,
    String? lastName,
    String? role,
    String? profileImageUrl,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
