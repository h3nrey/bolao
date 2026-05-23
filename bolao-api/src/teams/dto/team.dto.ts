import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  flag_emoji: z.string().emoji().optional(),
  flag_url: z.string().url().optional(),
});

export class CreateTeamDto extends createZodDto(createTeamSchema) {}

