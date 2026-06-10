import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  flag_emoji: z.string().optional().or(z.literal('')),
  flag_url: z.string().url().optional().or(z.literal('')),
  external_id: z.string().optional().nullable().or(z.literal('')),
});

export class CreateTeamDto extends createZodDto(createTeamSchema) {}

export const updateTeamSchema = createTeamSchema.partial();
export class UpdateTeamDto extends createZodDto(updateTeamSchema) {}

export const deleteTeamsSchema = z.object({
  ids: z.array(z.string().uuid()),
});
export class DeleteTeamsDto extends createZodDto(deleteTeamsSchema) {}

