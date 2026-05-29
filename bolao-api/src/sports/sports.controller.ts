import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SportsService } from './sports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('sports')
@UseGuards(JwtAuthGuard)
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Post('fixtures/sync')
  async syncFixtures(
    @Body('tournament_id') tournamentId: string,
    @Body('league_id') leagueId?: string,
    @Body('season') season?: string,
  ) {
    return this.sportsService.syncWorldCupFixtures(tournamentId, leagueId, season);
  }

  @Post('live/sync')
  async syncLive(
    @Query('league_id') leagueId?: string,
  ) {
    return this.sportsService.syncLiveScores(leagueId);
  }
}
