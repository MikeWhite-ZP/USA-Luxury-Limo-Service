import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/core/utils/extensions.dart';
import 'package:usa_luxury_limo/features/booking/data/booking_repository.dart';
import 'package:usa_luxury_limo/shared/models/vehicle_model.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_button.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_card.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_text_field.dart';

class BookingConfirmationScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? bookingData;

  const BookingConfirmationScreen({super.key, this.bookingData});

  @override
  ConsumerState<BookingConfirmationScreen> createState() =>
      _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState
    extends ConsumerState<BookingConfirmationScreen> {
  DateTime _selectedDate = DateTime.now().add(const Duration(hours: 1));
  TimeOfDay _selectedTime = TimeOfDay.now();
  final _notesController = TextEditingController();
  final _flightNumberController = TextEditingController();
  int _passengers = 1;
  int _luggage = 0;
  bool _isLoading = false;

  VehicleModel? get _vehicle {
    if (widget.bookingData?['vehicle'] != null) {
      return VehicleModel.fromJson(
        widget.bookingData!['vehicle'] as Map<String, dynamic>,
      );
    }
    return null;
  }

  @override
  void dispose() {
    _notesController.dispose();
    _flightNumberController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.gold,
              surface: AppColors.surface,
            ),
          ),
          child: child!,
        );
      },
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.gold,
              surface: AppColors.surface,
            ),
          ),
          child: child!,
        );
      },
    );
    if (time != null) {
      setState(() => _selectedTime = time);
    }
  }

  Future<void> _confirmBooking() async {
    if (_vehicle == null) return;

    setState(() => _isLoading = true);

    final scheduledDateTime = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _selectedTime.hour,
      _selectedTime.minute,
    );

    final repository = ref.read(bookingRepositoryProvider);
    final result = await repository.createBooking(
      pickupAddress: widget.bookingData?['pickupAddress'] as String? ?? '',
      dropoffAddress: widget.bookingData?['dropoffAddress'] as String? ?? '',
      scheduledDate: scheduledDateTime,
      vehicleTypeId: _vehicle!.id,
      passengers: _passengers,
      luggage: _luggage,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      flightNumber: _flightNumberController.text.isNotEmpty
          ? _flightNumberController.text
          : null,
    );

    setState(() => _isLoading = false);

    result.when(
      success: (booking) {
        _showSuccessDialog();
      },
      error: (message, _) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
          ),
        );
      },
      loading: () {},
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: AppColors.gold,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check,
                size: 48,
                color: AppColors.backgroundDark,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Booking Confirmed!',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            const Text(
              'Your ride has been successfully booked. You will receive a confirmation shortly.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            LuxuryButton(
              text: 'View My Rides',
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/rides');
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final estimatedPrice = widget.bookingData?['estimatedPrice'] as double?;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => context.pop(),
        ),
        title: const Text('Confirm Booking'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_vehicle != null) ...[
              LuxuryCard(
                child: Row(
                  children: [
                    Container(
                      width: 80,
                      height: 60,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.directions_car,
                        color: AppColors.gold,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _vehicle!.name,
                            style: const TextStyle(
                              fontFamily: 'Playfair',
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_vehicle!.passengerCapacity} passengers • ${_vehicle!.luggageCapacity} luggage',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            LuxuryCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Trip Details',
                    style: TextStyle(
                      fontFamily: 'Playfair',
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _DetailRow(
                    icon: Icons.circle,
                    iconColor: AppColors.gold,
                    iconSize: 12,
                    label: 'Pickup',
                    value: widget.bookingData?['pickupAddress'] as String? ?? '',
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    icon: Icons.circle,
                    iconColor: AppColors.success,
                    iconSize: 12,
                    label: 'Dropoff',
                    value: widget.bookingData?['dropoffAddress'] as String? ?? '',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            LuxuryCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Date & Time',
                    style: TextStyle(
                      fontFamily: 'Playfair',
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _SelectableField(
                          icon: Icons.calendar_today,
                          label: 'Date',
                          value: DateFormat('MMM d, yyyy').format(_selectedDate),
                          onTap: _selectDate,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _SelectableField(
                          icon: Icons.access_time,
                          label: 'Time',
                          value: _selectedTime.format(context),
                          onTap: _selectTime,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            LuxuryCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Passengers & Luggage',
                    style: TextStyle(
                      fontFamily: 'Playfair',
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _CounterField(
                          icon: Icons.person,
                          label: 'Passengers',
                          value: _passengers,
                          maxValue: _vehicle?.passengerCapacity ?? 10,
                          onChanged: (v) => setState(() => _passengers = v),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _CounterField(
                          icon: Icons.luggage,
                          label: 'Luggage',
                          value: _luggage,
                          maxValue: _vehicle?.luggageCapacity ?? 10,
                          onChanged: (v) => setState(() => _luggage = v),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            LuxuryCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Additional Information',
                    style: TextStyle(
                      fontFamily: 'Playfair',
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  LuxuryTextField(
                    controller: _flightNumberController,
                    hint: 'Flight number (optional)',
                    prefixIcon: Icons.flight,
                  ),
                  const SizedBox(height: 16),
                  LuxuryTextField(
                    controller: _notesController,
                    hint: 'Special requests or notes',
                    prefixIcon: Icons.note,
                    maxLines: 3,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (estimatedPrice != null) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total Estimated',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      estimatedPrice.formattedCurrency,
                      style: const TextStyle(
                        fontFamily: 'Playfair',
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              LuxuryButton(
                text: 'Confirm Booking',
                onPressed: _confirmBooking,
                isLoading: _isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final double iconSize;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.iconColor,
    this.iconSize = 20,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: iconSize),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
              Text(
                value,
                style: const TextStyle(fontSize: 14),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SelectableField extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _SelectableField({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.gold, size: 20),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CounterField extends StatelessWidget {
  final IconData icon;
  final String label;
  final int value;
  final int maxValue;
  final ValueChanged<int> onChanged;

  const _CounterField({
    required this.icon,
    required this.label,
    required this.value,
    required this.maxValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.gold, size: 24),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed: value > 0 ? () => onChanged(value - 1) : null,
                icon: const Icon(Icons.remove_circle_outline),
                color: value > 0 ? AppColors.textPrimary : AppColors.textTertiary,
                iconSize: 24,
              ),
              Text(
                '$value',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              IconButton(
                onPressed: value < maxValue ? () => onChanged(value + 1) : null,
                icon: const Icon(Icons.add_circle_outline),
                color: value < maxValue
                    ? AppColors.textPrimary
                    : AppColors.textTertiary,
                iconSize: 24,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
