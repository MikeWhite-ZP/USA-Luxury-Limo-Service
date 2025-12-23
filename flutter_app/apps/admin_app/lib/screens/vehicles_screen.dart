import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AdminVehiclesScreen extends ConsumerWidget {
  const AdminVehiclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicles'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Text('Vehicles Management - Coming Soon'),
      ),
    );
  }
}
