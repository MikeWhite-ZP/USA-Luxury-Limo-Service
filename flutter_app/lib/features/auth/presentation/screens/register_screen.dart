import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:usa_luxury_limo/core/theme/app_colors.dart';
import 'package:usa_luxury_limo/core/utils/validators.dart';
import 'package:usa_luxury_limo/features/auth/presentation/providers/auth_provider.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_button.dart';
import 'package:usa_luxury_limo/shared/widgets/luxury_text_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).register(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          phone: _phoneController.text.trim(),
        );

    if (success && mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Create Account',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: 'Playfair',
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign up to get started',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 32),

                Row(
                  children: [
                    Expanded(
                      child: LuxuryTextField(
                        controller: _firstNameController,
                        label: 'First Name',
                        hint: 'John',
                        prefixIcon: Icons.person_outline,
                        textInputAction: TextInputAction.next,
                        validator: Validators.name,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: LuxuryTextField(
                        controller: _lastNameController,
                        label: 'Last Name',
                        hint: 'Doe',
                        textInputAction: TextInputAction.next,
                        validator: Validators.name,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                LuxuryTextField(
                  controller: _emailController,
                  label: 'Email',
                  hint: 'john@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: Validators.email,
                ),
                const SizedBox(height: 20),

                LuxuryTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hint: '(555) 123-4567',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  validator: Validators.phone,
                ),
                const SizedBox(height: 20),

                LuxuryTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: 'Create a password',
                  prefixIcon: Icons.lock_outline,
                  obscureText: true,
                  textInputAction: TextInputAction.next,
                  validator: Validators.password,
                ),
                const SizedBox(height: 20),

                LuxuryTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  hint: 'Confirm your password',
                  prefixIcon: Icons.lock_outline,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  validator: (value) => Validators.confirmPassword(
                    value,
                    _passwordController.text,
                  ),
                  onSubmitted: (_) => _handleRegister(),
                ),
                const SizedBox(height: 32),

                LuxuryButton(
                  text: 'Create Account',
                  onPressed: _handleRegister,
                  isLoading: authState.isLoading,
                ),
                const SizedBox(height: 24),

                Center(
                  child: Text(
                    'By signing up, you agree to our Terms of Service and Privacy Policy',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Sign In'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
