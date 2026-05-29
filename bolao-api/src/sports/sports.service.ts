import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SportsProviderAdapter } from './interfaces/sports-provider.adapter';
import { MatchesService } from '../matches/matches.service';
import { ScoringService } from '../predictions/scoring.service';
import { RankingsService } from '../rankings/rankings.service';

@Injectable()
export class SportsService {
  private readonly logger = new Logger(SportsService.name);
  private readonly providerName = 'api-sports';

  constructor(
    private prisma: PrismaService,
    private adapter: SportsProviderAdapter,
    private matchesService: MatchesService,
    private scoringService: ScoringService,
    private rankingsService: RankingsService,
  ) {}

  async syncWorldCupFixtures(tournamentId: string, leagueId = '1', season = '2026') {
    this.logger.log(`Starting fixtures sync for World Cup (League ${leagueId}, Season ${season})...`);

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { phases: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Ensure there is at least one phase to link matches to
    let phase = tournament.phases[0];
    if (!phase) {
      phase = await this.prisma.phase.create({
        data: {
          tournament_id: tournamentId,
          name: 'Fase de Grupos',
          type: 'groups',
          order: 1,
        },
      });
    }

    const fixtures = await this.adapter.fetchFixtures(leagueId, season);
    this.logger.log(`Retrieved ${fixtures.length} fixtures from provider.`);

    let syncedCount = 0;

    for (const fixture of fixtures) {
      // 1. Sync Team A
      let dbTeamA = await this.prisma.team.findFirst({
        where: {
          OR: [
            { provider: this.providerName, external_id: fixture.team_a.external_id },
            { name: { equals: fixture.team_a.name, mode: 'insensitive' } },
          ],
        },
      });

      if (!dbTeamA) {
        dbTeamA = await this.prisma.team.create({
          data: {
            name: fixture.team_a.name,
            flag_url: fixture.team_a.flag_url,
            provider: this.providerName,
            external_id: fixture.team_a.external_id,
          },
        });
      } else if (!dbTeamA.provider || !dbTeamA.external_id) {
        dbTeamA = await this.prisma.team.update({
          where: { id: dbTeamA.id },
          data: {
            provider: this.providerName,
            external_id: fixture.team_a.external_id,
            flag_url: fixture.team_a.flag_url || dbTeamA.flag_url,
          },
        });
      }

      // 2. Sync Team B
      let dbTeamB = await this.prisma.team.findFirst({
        where: {
          OR: [
            { provider: this.providerName, external_id: fixture.team_b.external_id },
            { name: { equals: fixture.team_b.name, mode: 'insensitive' } },
          ],
        },
      });

      if (!dbTeamB) {
        dbTeamB = await this.prisma.team.create({
          data: {
            name: fixture.team_b.name,
            flag_url: fixture.team_b.flag_url,
            provider: this.providerName,
            external_id: fixture.team_b.external_id,
          },
        });
      } else if (!dbTeamB.provider || !dbTeamB.external_id) {
        dbTeamB = await this.prisma.team.update({
          where: { id: dbTeamB.id },
          data: {
            provider: this.providerName,
            external_id: fixture.team_b.external_id,
            flag_url: fixture.team_b.flag_url || dbTeamB.flag_url,
          },
        });
      }

      // 3. Sync Match
      let dbMatch = await this.prisma.match.findFirst({
        where: {
          OR: [
            { provider: this.providerName, external_id: fixture.external_id },
            {
              team_a_id: dbTeamA.id,
              team_b_id: dbTeamB.id,
              scheduled_at: {
                gte: new Date(new Date(fixture.scheduled_at).getTime() - 12 * 60 * 60 * 1000), // 12h window
                lte: new Date(new Date(fixture.scheduled_at).getTime() + 12 * 60 * 60 * 1000),
              },
            },
          ],
        },
      });

      if (!dbMatch) {
        dbMatch = await this.prisma.match.create({
          data: {
            phase_id: phase.id,
            team_a_id: dbTeamA.id,
            team_b_id: dbTeamB.id,
            scheduled_at: fixture.scheduled_at,
            stage: 'groups',
            status: fixture.status as any,
            score_a: fixture.score_a,
            score_b: fixture.score_b,
            provider: this.providerName,
            external_id: fixture.external_id,
          },
        });
      } else {
        dbMatch = await this.prisma.match.update({
          where: { id: dbMatch.id },
          data: {
            provider: this.providerName,
            external_id: fixture.external_id,
            scheduled_at: fixture.scheduled_at,
            score_a: fixture.score_a,
            score_b: fixture.score_b,
            status: fixture.status as any,
          },
        });
      }

      syncedCount++;
    }

    this.logger.log(`Fixtures sync completed. Mapped/created ${syncedCount} matches.`);
    return { success: true, count: syncedCount };
  }

  async syncLiveScores(leagueId = '1') {
    this.logger.log(`Starting live scores synchronization for League ID ${leagueId}...`);
    const liveFixtures = await this.adapter.fetchLiveFixtures(leagueId);
    this.logger.log(`Retrieved ${liveFixtures.length} live fixtures from provider.`);

    let updatedCount = 0;

    for (const fixture of liveFixtures) {
      const dbMatch = await this.prisma.match.findUnique({
        where: {
          provider_external_id: {
            provider: this.providerName,
            external_id: fixture.external_id,
          },
        },
        include: {
          phase: true,
        },
      });

      if (!dbMatch) {
        this.logger.warn(`Live fixture ID ${fixture.external_id} (${fixture.team_a.name} vs ${fixture.team_b.name}) has no mapped local Match.`);
        continue;
      }

      // Update match status and scores cache
      const wasUpcoming = dbMatch.status === 'upcoming';
      const isFinishing = fixture.status === 'finished' && dbMatch.status !== 'finished';

      await this.prisma.match.update({
        where: { id: dbMatch.id },
        data: {
          score_a: fixture.score_a,
          score_b: fixture.score_b,
          status: fixture.status as any,
          started_at: wasUpcoming ? new Date() : dbMatch.started_at,
          ended_at: isFinishing ? new Date() : dbMatch.ended_at,
        },
      });

      // Synchronize Goal Events
      for (const goal of fixture.goals) {
        // Map external team to local team
        const isTeamAGoal = goal.team_external_id === fixture.team_a.external_id;
        const goalTeamId = isTeamAGoal ? dbMatch.team_a_id : dbMatch.team_b_id;

        if (!goalTeamId) continue;

        // Check if event already exists locally
        const eventExists = await this.prisma.matchEvent.findFirst({
          where: {
            match_id: dbMatch.id,
            minute: goal.minute,
            team_id: goalTeamId,
            type: goal.is_own_goal ? 'own_goal' : 'goal',
          },
        });

        if (!eventExists) {
          this.logger.log(`New live goal detected for Match ${dbMatch.id} at ${goal.minute}'! Registering...`);
          await this.prisma.matchEvent.create({
            data: {
              match_id: dbMatch.id,
              team_id: goalTeamId,
              minute: goal.minute,
              period: goal.period as any,
              type: goal.is_own_goal ? 'own_goal' : 'goal',
            },
          });
        }
      }

      // Trigger point recalculation
      await this.scoringService.recalculateMatch(dbMatch.id);
      await this.rankingsService.recalculate(dbMatch.phase.tournament_id, dbMatch.phase_id);

      updatedCount++;
    }

    this.logger.log(`Live scores sync completed. Synchronized ${updatedCount} active matches.`);
    return { success: true, count: updatedCount };
  }
}
