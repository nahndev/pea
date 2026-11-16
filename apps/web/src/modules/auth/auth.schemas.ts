import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string('required').trim().toLowerCase().min(1, 'required'),
  password: z.string('required').min(1, 'required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
