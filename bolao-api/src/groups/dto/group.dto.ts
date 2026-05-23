import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().length(1), // "A", "B", etc.
});

export const setFinalPositionSchema = z.object({
  final_position: z.number().int().min(1).max(4),
});

export const addTeamSchema = z.object({
  team_id: z.string().uuid(),
});

export class CreateGroupDto extends createZodDto(createGroupSchema) {}
export class SetFinalPositionDto extends createZodDto(setFinalPositionSchema) {}
export class AddTeamDto extends createZodDto(addTeamSchema) {}

