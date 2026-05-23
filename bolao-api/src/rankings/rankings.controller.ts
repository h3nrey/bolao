import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('rankings')
@UseGuards(JwtAuthGuard)
export class RankingsController {
  constructor(private rankingsService: RankingsService) {}

  @Get()
  async getRankings(
    @Query('tournament_id') tournamentId: string,
    @Query('phase_id') phaseId?: string,
  ) {
    return this.rankingsService.getFormatted(tournamentId, phaseId);
  }
}
