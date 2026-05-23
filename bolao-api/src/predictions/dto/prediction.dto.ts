import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPredictionSchema = z.object({
  items: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('score_a'), value_int: z.number().int().min(0) }),
    z.object({ type: z.literal('score_b'), value_int: z.number().int().min(0) }),
    z.object({ type: z.literal('first_goal_team'), value_team_id: z.string().uuid() }),
    z.object({ type: z.literal('first_goal_player'), value_player_id: z.string().uuid() }),
    z.object({ type: z.literal('went_to_extra_time'), value_int: z.literal(1) }),
    z.object({ type: z.literal('went_to_penalties'), value_int: z.literal(1) }),
  ])),
});

export class CreatePredictionDto extends createZodDto(createPredictionSchema) {}

