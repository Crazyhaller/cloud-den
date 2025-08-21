import * as zod from 'zod'

export const signUpSchema = zod
  .object({
    email: zod
      .string()
      .email({ message: 'Please enter a valid email' })
      .min(1, 'Email is required'),
    password: zod
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long'),
    passwordConfirmation: zod
      .string()
      .min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Password does not match',
    path: ['passwordConfirmation'],
  })
