import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PROJECT_VALUES, SENIORITY_VALUES } from '../user.constants';

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  project: z.enum(PROJECT_VALUES).nullable().optional(),
  seniority: z.enum(SENIORITY_VALUES).nullable().optional(),
  is_admin: z.boolean().optional(),
});

export class AdminUpdateUserDto extends createZodDto(adminUpdateUserSchema) {}
