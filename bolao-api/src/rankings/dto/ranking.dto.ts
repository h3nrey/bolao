import { z } from 'zod';

export const rankingQuerySchema = z.object({
  tournament_id: z.string().uuid(),
  phase_id: z.string().uuid().optional(),
});

export type RankingQueryDto = z.infer<typeof rankingQuerySchema>;
