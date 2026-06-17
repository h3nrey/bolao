import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
});

export const updateTournamentSchema = z.object({
  status: z.enum(['draft', 'active', 'finished']).optional(),
  special_predictions_active: z.boolean().optional(),
});

export class CreateTournamentDto extends createZodDto(createTournamentSchema) {}
export class UpdateTournamentDto extends createZodDto(updateTournamentSchema) {}
