import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
});

export type ProfileForm = z.infer<typeof profileSchema>;
