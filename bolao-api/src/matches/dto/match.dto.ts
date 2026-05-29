import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createMatchSchema = z.object({
  group_id: z.string().uuid().optional(),
  stage: z.enum(['groups','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final']),
  round: z.string().optional(),
  team_a_id: z.string().uuid().optional(),
  team_b_id: z.string().uuid().optional(),
  scheduled_at: z.coerce.date(),
});

export class CreateMatchDto extends createZodDto(createMatchSchema) {}
