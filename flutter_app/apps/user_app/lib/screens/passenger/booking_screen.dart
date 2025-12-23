import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  int _currentStep = 0;
  String _bookingType = 'point_to_point';
  final _pickupController = TextEditingController();
  final _destinationController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  int _passengerCount = 1;
  String? _selectedVehicleType;

  @override
  void dispose() {
    _pickupController.dispose();
    _destinationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/passenger'),
        ),
        title: const Text('Book a Ride'),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildStepIndicator(0, 'Type', primaryColor),
                _buildStepConnector(0 < _currentStep),
                _buildStepIndicator(1, 'Route', primaryColor),
                _buildStepConnector(1 < _currentStep),
                _buildStepIndicator(2, 'Vehicle', primaryColor),
                _buildStepConnector(2 < _currentStep),
                _buildStepIndicator(3, 'Confirm', primaryColor),
              ],
            ),
          ),
          const Divider(height: 1),
          
          Expanded(
            child: _buildCurrentStep(),
          ),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  if (_currentStep > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          setState(() {
                            _currentStep--;
                          });
                        },
                        child: const Text('Back'),
                      ),
                    ),
                  if (_currentStep > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: _currentStep > 0 ? 1 : 2,
                    child: ElevatedButton(
                      onPressed: _canProceed() ? _handleNext : null,
                      child: Text(
                        _currentStep == 3 ? 'Confirm Booking' : 'Continue',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label, Color primaryColor) {
    final isActive = _currentStep >= step;
    final isCurrent = _currentStep == step;

    return Expanded(
      child: Column(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isActive ? primaryColor : Colors.grey.shade300,
              shape: BoxShape.circle,
              border: isCurrent
                  ? Border.all(color: primaryColor, width: 2)
                  : null,
            ),
            child: Center(
              child: isActive && !isCurrent
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : Text(
                      '${step + 1}',
                      style: TextStyle(
                        color: isActive ? Colors.white : Colors.grey.shade600,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isActive ? primaryColor : Colors.grey.shade600,
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector(bool isActive) {
    return Container(
      width: 20,
      height: 2,
      color: isActive ? Theme.of(context).primaryColor : Colors.grey.shade300,
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildBookingTypeStep();
      case 1:
        return _buildRouteStep();
      case 2:
        return _buildVehicleStep();
      case 3:
        return _buildConfirmStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildBookingTypeStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Service Type',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose the type of service you need',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).hintColor,
            ),
          ),
          const SizedBox(height: 24),

          _buildBookingTypeOption(
            'point_to_point',
            Icons.location_on,
            'Point to Point',
            'Direct transfer from A to B',
            Colors.green,
          ),
          const SizedBox(height: 12),
          _buildBookingTypeOption(
            'hourly',
            Icons.access_time,
            'Hourly Charter',
            'Book by the hour for multiple stops',
            Colors.orange,
          ),
          const SizedBox(height: 12),
          _buildBookingTypeOption(
            'airport_pickup',
            Icons.flight_land,
            'Airport Pickup',
            'We track your flight for timely pickup',
            Colors.blue,
          ),
          const SizedBox(height: 12),
          _buildBookingTypeOption(
            'airport_dropoff',
            Icons.flight_takeoff,
            'Airport Drop-off',
            'Get to the airport on time',
            Colors.purple,
          ),
        ],
      ),
    );
  }

  Widget _buildBookingTypeOption(
    String value,
    IconData icon,
    String title,
    String description,
    Color color,
  ) {
    final isSelected = _bookingType == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _bookingType = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Theme.of(context).dividerColor,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).hintColor,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: Theme.of(context).primaryColor,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Enter Route Details',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),

          TextFormField(
            controller: _pickupController,
            decoration: InputDecoration(
              labelText: 'Pickup Location',
              prefixIcon: const Icon(Icons.trip_origin),
              suffixIcon: IconButton(
                icon: const Icon(Icons.my_location),
                onPressed: () {},
              ),
            ),
          ),
          const SizedBox(height: 16),

          if (_bookingType != 'hourly')
            TextFormField(
              controller: _destinationController,
              decoration: const InputDecoration(
                labelText: 'Destination',
                prefixIcon: Icon(Icons.location_on),
              ),
            ),
          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setState(() {
                        _selectedDate = date;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today),
                        const SizedBox(width: 12),
                        Text(
                          '${_selectedDate.month}/${_selectedDate.day}/${_selectedDate.year}',
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: _selectedTime,
                    );
                    if (time != null) {
                      setState(() {
                        _selectedTime = time;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.access_time),
                        const SizedBox(width: 12),
                        Text(_selectedTime.format(context)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          Text(
            'Passengers',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              IconButton(
                onPressed: _passengerCount > 1
                    ? () => setState(() => _passengerCount--)
                    : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text(
                '$_passengerCount',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              IconButton(
                onPressed: _passengerCount < 20
                    ? () => setState(() => _passengerCount++)
                    : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleStep() {
    final vehicles = [
      {'id': 'sedan', 'name': 'Executive Sedan', 'capacity': 3, 'price': 85},
      {'id': 'suv', 'name': 'Premium SUV', 'capacity': 6, 'price': 120},
      {'id': 'van', 'name': 'Luxury Van', 'capacity': 10, 'price': 180},
      {'id': 'stretch', 'name': 'Stretch Limo', 'capacity': 8, 'price': 250},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Vehicle',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          ...vehicles.map((vehicle) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildVehicleOption(vehicle),
          )),
        ],
      ),
    );
  }

  Widget _buildVehicleOption(Map<String, dynamic> vehicle) {
    final isSelected = _selectedVehicleType == vehicle['id'];

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedVehicleType = vehicle['id'] as String;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Theme.of(context).dividerColor,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 80,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.directions_car, size: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vehicle['name'] as String,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Up to ${vehicle['capacity']} passengers',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).hintColor,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '\$${vehicle['price']}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                Text(
                  'estimated',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).hintColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfirmStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm Your Booking',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              children: [
                _buildConfirmRow('Service', _bookingType.replaceAll('_', ' ').toUpperCase()),
                const Divider(),
                _buildConfirmRow('Pickup', _pickupController.text.isNotEmpty 
                    ? _pickupController.text 
                    : 'Not set'),
                if (_bookingType != 'hourly') ...[
                  const Divider(),
                  _buildConfirmRow('Destination', _destinationController.text.isNotEmpty 
                      ? _destinationController.text 
                      : 'Not set'),
                ],
                const Divider(),
                _buildConfirmRow('Date', '${_selectedDate.month}/${_selectedDate.day}/${_selectedDate.year}'),
                const Divider(),
                _buildConfirmRow('Time', _selectedTime.format(context)),
                const Divider(),
                _buildConfirmRow('Passengers', '$_passengerCount'),
                const Divider(),
                _buildConfirmRow('Vehicle', _selectedVehicleType ?? 'Not selected'),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Estimated Total',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  '\$120.00',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).hintColor,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  bool _canProceed() {
    switch (_currentStep) {
      case 0:
        return _bookingType.isNotEmpty;
      case 1:
        return _pickupController.text.isNotEmpty;
      case 2:
        return _selectedVehicleType != null;
      case 3:
        return true;
      default:
        return false;
    }
  }

  void _handleNext() {
    if (_currentStep < 3) {
      setState(() {
        _currentStep++;
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking submitted!')),
      );
      context.go('/passenger');
    }
  }
}
