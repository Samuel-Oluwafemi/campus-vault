import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

export const registrationSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  confirmPassword: z.string().min(8, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});
