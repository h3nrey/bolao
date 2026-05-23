import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPhaseSchema = z.object({
  name: z.string(),
  type: z.enum(['groups', 'knockout']),
  order: z.number().int().positive(),
});

export const updatePhaseStatusSchema = z.object({
  status: z.enum(['upcoming', 'active', 'finished']),
});

export class CreatePhaseDto extends createZodDto(createPhaseSchema) {}
export class UpdatePhaseStatusDto extends createZodDto(updatePhaseStatusSchema) {}

