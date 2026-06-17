import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
});

export const updateTournamentSchema = z.object({
  status: z.enum(['draft', 'active', 'finished']).optional(),
  special_predictions_active: z.boolean().optional(),
  multipliers_active: z.boolean().optional(),
  multiplier_scorer_pts: z.number().int().min(0).optional(),
  multiplier_first_goal_pts: z.number().int().min(0).optional(),
  multiplier_cards_pts: z.number().int().min(0).optional(),
  multiplier_corners_pts: z.number().int().min(0).optional(),
  multiplier_both_score_pts: z.number().int().min(0).optional(),
});

export class CreateTournamentDto extends createZodDto(createTournamentSchema) {}
export class UpdateTournamentDto extends createZodDto(updateTournamentSchema) {}
