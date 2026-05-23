import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createMatchEventSchema = z.object({
  team_id: z.string().uuid(),
  player_id: z.string().uuid().optional(),
  type: z.enum(['goal','own_goal','yellow_card','red_card','substitution']),
  minute: z.number().int().min(1).max(130),
  period: z.enum(['regular','extra_time','penalties']),
});

export class CreateMatchEventDto extends createZodDto(createMatchEventSchema) {}

