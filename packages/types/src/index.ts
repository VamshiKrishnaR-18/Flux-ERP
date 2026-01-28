import { z } from 'zod';

export const ClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),

})

export type ClientType = z.infer<typeof ClientSchema>;