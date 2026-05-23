import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPlayerSchema = z.object({
  team_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  number: z.number().int().min(1).max(99).optional(),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  number: z.number().int().min(1).max(99).optional(),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).optional(),
  is_active: z.boolean().optional(),
});

export class CreatePlayerDto extends createZodDto(createPlayerSchema) {}
export class UpdatePlayerDto extends createZodDto(updatePlayerSchema) {}

