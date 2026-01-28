import { z } from 'zod';

export const TestSchema = z.object({
  message: z.string(),
  status: z.number()
});

export type TestType = z.infer<typeof TestSchema>;