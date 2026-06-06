import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const submitSpecialPredictionSchema = z.object({
  champion_team_id: z.string().uuid().nullable().optional(),
  runner_up_team_id: z.string().uuid().nullable().optional(),
  third_place_team_id: z.string().uuid().nullable().optional(),
  top_scorer_player_id: z.string().uuid().nullable().optional(),
  best_player_player_id: z.string().uuid().nullable().optional(),
  surprise_team_id: z.string().uuid().nullable().optional(),
});

export class SubmitSpecialPredictionDto extends createZodDto(submitSpecialPredictionSchema) {}

export const submitOfficialSpecialResultsSchema = submitSpecialPredictionSchema;
export class SubmitOfficialSpecialResultsDto extends createZodDto(submitOfficialSpecialResultsSchema) {}
