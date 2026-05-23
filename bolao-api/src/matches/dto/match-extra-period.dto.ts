import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createExtraPeriodSchema = z.object({
  type: z.enum(['extra_time', 'penalties']),
});

export const updateExtraPeriodSchema = z.object({
  winner_team_id: z.string().uuid().optional(),
  penalty_score_a: z.number().int().min(0).optional(),
  penalty_score_b: z.number().int().min(0).optional(),
  ended_at: z.coerce.date().optional(),
});

export class CreateExtraPeriodDto extends createZodDto(createExtraPeriodSchema) {}
export class UpdateExtraPeriodDto extends createZodDto(updateExtraPeriodSchema) {}

