import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  project: z.enum(['avamec', 'siscad', 'inovaula', 'materiais-digitais', 'outro']),
  seniority: z.enum(['bolsista', 'clt', 'gerente', 'pmo', 'outro']),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  project?: 'avamec' | 'siscad' | 'inovaula' | 'materiais-digitais' | 'outro' | null;
  seniority?: 'bolsista' | 'clt' | 'gerente' | 'pmo' | 'outro' | null;
  created_at: Date;
  updated_at: Date;
}
