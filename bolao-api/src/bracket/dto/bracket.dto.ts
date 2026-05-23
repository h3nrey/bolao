import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createBracketSlotSchema = z.object({
  stage: z.enum(['groups','round_of_16','quarterfinal','semifinal','third_place','final']),
  slot_number: z.number().int().positive(),
  source_a_type: z.enum(['group_position', 'bracket_slot']),
  source_a_ref: z.string().min(1),
  source_b_type: z.enum(['group_position', 'bracket_slot']),
  source_b_ref: z.string().min(1),
  match_id: z.string().uuid().optional(),
});

export class CreateBracketSlotDto extends createZodDto(createBracketSlotSchema) {}

