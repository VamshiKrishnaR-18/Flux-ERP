import { z } from 'zod';

export const ClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),

})
export type ClientType = z.infer<typeof ClientSchema>;


export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['admin', 'user']).default('user'),
  
})
export type UserType = z.infer<typeof UserSchema>;


export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),

})
export type LoginType = z.infer<typeof LoginSchema>;