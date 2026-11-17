import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const registrationSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  password: z.string()
    .min(8, 'Use at least 8 characters.')
    .regex(/[a-z]/, 'Add a lowercase letter.')
    .regex(/[A-Z]/, 'Add an uppercase letter.')
    .regex(/[0-9]/, 'Add a number.')
    .regex(/[^A-Za-z0-9\s]/, 'Add a symbol.'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});
