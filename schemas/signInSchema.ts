import * as zod from 'zod'

export const signInSchema = zod.object({
  identifier: zod
    .string()
    .email({ message: 'Please enter a valid email' })
    .min(1, 'Email is required'),
  password: zod
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
})
