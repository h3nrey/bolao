import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createMatchSchema = z.object({
  group_id: z.string().uuid().optional(),
  stage: z.enum([
    'groups',
    'round_of_32',
    'round_of_16',
    'quarterfinal',
    'semifinal',
    'third_place',
    'final',
  ]),
  round: z.string().optional(),
  team_a_id: z.string().uuid().optional(),
  team_b_id: z.string().uuid().optional(),
  scheduled_at: z.coerce.date(),
});

export class CreateMatchDto extends createZodDto(createMatchSchema) {}

export const updateMatchSchema = z.object({
  group_id: z.string().uuid().nullable().optional(),
  stage: z.enum([
    'groups',
    'round_of_32',
    'round_of_16',
    'quarterfinal',
    'semifinal',
    'third_place',
    'final',
  ]).optional(),
  round: z.string().nullable().optional(),
  team_a_id: z.string().uuid().nullable().optional(),
  team_b_id: z.string().uuid().nullable().optional(),
  scheduled_at: z.coerce.date().optional(),
  status: z.enum(['upcoming', 'live', 'finished', 'cancelled']).optional(),
  score_a: z.number().int().min(0).optional(),
  score_b: z.number().int().min(0).optional(),
  score_a_extra: z.number().int().min(0).optional(),
  score_b_extra: z.number().int().min(0).optional(),
  penalty_score_a: z.number().int().min(0).nullable().optional(),
  penalty_score_b: z.number().int().min(0).nullable().optional(),
});

export class UpdateMatchDto extends createZodDto(updateMatchSchema) {}
