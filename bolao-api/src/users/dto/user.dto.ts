import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PROJECT_VALUES, SENIORITY_VALUES, ProjectValue, SeniorityValue } from '../user.constants';

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  project: z.enum(PROJECT_VALUES),
  seniority: z.enum(SENIORITY_VALUES),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  project?: ProjectValue | null;
  seniority?: SeniorityValue | null;
  created_at: Date;
  updated_at: Date;
}
