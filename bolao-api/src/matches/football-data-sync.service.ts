import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesService } from './matches.service';

const API_TO_DB_TEAM_NAME: Record<string, string> = {
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Cape Verde Islands': 'Cape Verde',
  'Congo DR': 'DR Congo',
  'Czechia': 'Czech Republic',
  'United States': 'USA',
};

@Injectable()
export class FootballDataSyncService {
  private readonly logger = new Logger(FootballDataSyncService.name);
  private lastSyncTime = 0;

  constructor(
    private prisma: PrismaService,
    private matchesService: MatchesService,
  ) {}

  @Cron('*/5 * * * *')
  async handleCron() {
    this.logger.log('Starting scheduled Football-Data.org matches synchronization...');
    const result = await this.syncMatches();
    this.logger.log(`Scheduled sync finished: ${result.message}`);
  }

  async syncMatches(dryRun = false): Promise<{ success: boolean; message: string; details?: any }> {
    const now = Date.now();
    // Protect against spamming the Football-Data API (limit: 1 request per minute)
    if (!dryRun && now - this.lastSyncTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - this.lastSyncTime)) / 1000);
      const msg = `Sync skipped: Rate limit guard active. Try again in ${remainingSeconds}s.`;
      this.logger.warn(msg);
      return { success: false, message: msg };
    }

    const apiKey = process.env.FOOTBALL_DATA_KEY;
    if (!apiKey) {
      const msg = 'Sync aborted: FOOTBALL_DATA_KEY is not defined in the environment.';
      this.logger.warn(msg);
      return { success: false, message: msg };
    }

    if (!dryRun) {
      this.lastSyncTime = now;
    }

    try {
      // Determine the current stage based on the earliest unfinished match
      const currentMatch = await this.prisma.match.findFirst({
        where: {
          status: { in: ['upcoming', 'live'] },
        },
        orderBy: [
          { scheduled_at: 'asc' },
        ],
      });

      let stageFilter = '';
      if (currentMatch) {
        const stageMapping: Record<string, string> = {
          groups: 'GROUP_STAGE',
          round_of_32: 'LAST_32',
          round_of_16: 'LAST_16',
          quarterfinal: 'QUARTER_FINALS',
          semifinal: 'SEMI_FINALS',
          third_place: 'THIRD_PLACE',
          final: 'FINAL',
        };
        const apiStage = stageMapping[currentMatch.stage];
        if (apiStage) {
          stageFilter = `?stage=${apiStage}`;
          this.logger.log(`Detected current stage from database: ${currentMatch.stage} (API filter: ${apiStage})`);
        }
      } else {
        this.logger.log('No upcoming or live matches found in database. Syncing all stages.');
      }

      this.logger.log(`Fetching World Cup fixtures from Football-Data.org (Filter: ${stageFilter || 'none'})...`);
      const response = await fetch(`https://api.football-data.org/v4/competitions/WC/matches${stageFilter}`, {
        headers: {
          'X-Auth-Token': apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.matches)) {
        throw new Error('Invalid response structure: "matches" array not found.');
      }

      // Find the active tournament
      const tournament = await this.prisma.tournament.findFirst({
        where: { status: 'active' },
      });

      if (!tournament) {
        throw new Error('No active tournament found in the database.');
      }

      // Find or create phases
      let phaseGrupos = await this.prisma.phase.findFirst({
        where: { tournament_id: tournament.id, type: 'groups' },
      });
      if (!phaseGrupos) {
        phaseGrupos = await this.prisma.phase.create({
          data: {
            tournament_id: tournament.id,
            name: 'Fase de Grupos',
            type: 'groups',
            status: 'active',
            order: 1,
          },
        });
      }

      let knockoutPhase = await this.prisma.phase.findFirst({
        where: { tournament_id: tournament.id, type: 'knockout' },
      });
      if (!knockoutPhase) {
        knockoutPhase = await this.prisma.phase.create({
          data: {
            tournament_id: tournament.id,
            name: 'Fase Eliminatória',
            type: 'knockout',
            status: 'active',
            order: 2,
          },
        });
      }

      const apiStageToDbStage: Record<string, any> = {
        GROUP_STAGE: 'groups',
        LAST_32: 'round_of_32',
        LAST_16: 'round_of_16',
        QUARTER_FINALS: 'quarterfinal',
        SEMI_FINALS: 'semifinal',
        THIRD_PLACE: 'third_place',
        FINAL: 'final',
      };

      this.logger.log(`Fetched ${data.matches.length} matches from API. processing...`);
      let updatedCount = 0;
      let matchedCount = 0;
      const updatesLog: string[] = [];

      for (const apiMatch of data.matches) {
        const apiHomeName = apiMatch.homeTeam?.name;
        const apiAwayName = apiMatch.awayTeam?.name;

        if (!apiHomeName || !apiAwayName) {
          continue;
        }

        // Translate team names if mismatched
        const dbHomeName = API_TO_DB_TEAM_NAME[apiHomeName] || apiHomeName;
        const dbAwayName = API_TO_DB_TEAM_NAME[apiAwayName] || apiAwayName;

        // Find teams in our database
        const teamA = await this.prisma.team.findFirst({ where: { name: dbHomeName } });
        const teamB = await this.prisma.team.findFirst({ where: { name: dbAwayName } });

        if (!teamA || !teamB) {
          continue;
        }

        const utcDate = new Date(apiMatch.utcDate);

        // Find match in our database
        let dbMatch = await this.prisma.match.findFirst({
          where: {
            OR: [
              {
                provider: 'football-data',
                external_id: apiMatch.id.toString(),
              },
              {
                team_a_id: teamA.id,
                team_b_id: teamB.id,
                scheduled_at: utcDate,
              },
            ],
          },
        });

        // Map status
        let mappedStatus: 'upcoming' | 'live' | 'finished' | 'cancelled';
        switch (apiMatch.status) {
          case 'FINISHED':
            mappedStatus = 'finished';
            break;
          case 'IN_PLAY':
          case 'PAUSED':
            mappedStatus = 'live';
            break;
          case 'CANCELLED':
            mappedStatus = 'cancelled';
            break;
          default:
            mappedStatus = 'upcoming';
            break;
        }

        // Extract scores
        const scoreInfo = apiMatch.score;
        const fullTime = scoreInfo?.fullTime;
        const hasNoScoreYet = fullTime?.home === null || fullTime?.away === null;

        const apiScoreA = fullTime?.home ?? 0;
        const apiScoreB = fullTime?.away ?? 0;

        const regularTime = scoreInfo?.regularTime;
        const scoreARegular = regularTime ? (regularTime.home ?? apiScoreA) : apiScoreA;
        const scoreBRegular = regularTime ? (regularTime.away ?? apiScoreB) : apiScoreB;

        const extraTime = scoreInfo?.extraTime;
        const scoreAExtra = extraTime ? (extraTime.home ?? 0) : 0;
        const scoreBExtra = extraTime ? (extraTime.away ?? 0) : 0;

        const penalties = scoreInfo?.penalties;
        const penaltyScoreA = penalties ? penalties.home : null;
        const penaltyScoreB = penalties ? penalties.away : null;

        if (!dbMatch) {
          const dbStage = apiStageToDbStage[apiMatch.stage] || 'groups';
          const phaseId = dbStage === 'groups' ? phaseGrupos.id : knockoutPhase.id;

          if (dryRun) {
            this.logger.log(`[DryRun] Would create match: ${dbHomeName} x ${dbAwayName} (${dbStage})`);
            continue;
          }

          dbMatch = await this.prisma.match.create({
            data: {
              phase_id: phaseId,
              stage: dbStage,
              team_a_id: teamA.id,
              team_b_id: teamB.id,
              scheduled_at: utcDate,
              status: mappedStatus,
              provider: 'football-data',
              external_id: apiMatch.id.toString(),
              score_a: scoreARegular,
              score_b: scoreBRegular,
              score_a_extra: scoreAExtra,
              score_b_extra: scoreBExtra,
              penalty_score_a: penaltyScoreA,
              penalty_score_b: penaltyScoreB,
            },
          });

          updatesLog.push(`Created match ID ${dbMatch.id}: ${dbHomeName} x ${dbAwayName} (${dbStage})`);
          this.logger.log(`Created match ID ${dbMatch.id}: ${dbHomeName} x ${dbAwayName} (${dbStage})`);
          updatedCount++;
          matchedCount++;
          continue;
        }

        matchedCount++;

        // Check for updates
        const statusChanged = dbMatch.status !== mappedStatus;
        const scoreChanged = !hasNoScoreYet && (
          dbMatch.score_a !== scoreARegular ||
          dbMatch.score_b !== scoreBRegular ||
          dbMatch.score_a_extra !== scoreAExtra ||
          dbMatch.score_b_extra !== scoreBExtra ||
          dbMatch.penalty_score_a !== penaltyScoreA ||
          dbMatch.penalty_score_b !== penaltyScoreB
        );

        if (statusChanged || scoreChanged) {
          const logMsg = `Match ID ${dbMatch.id} (${dbHomeName} x ${dbAwayName}): Status (${dbMatch.status} -> ${mappedStatus}), Score (${dbMatch.score_a}-${dbMatch.score_b} -> ${scoreARegular}-${scoreBRegular})`;
          updatesLog.push(logMsg);
          this.logger.log(`Updating ${logMsg}`);

          if (!dryRun) {
            // Upsert extra periods if duration is EXTRA_TIME or PENALTY_SHOOTOUT
            if (scoreInfo.duration === 'EXTRA_TIME' || scoreInfo.duration === 'PENALTY_SHOOTOUT') {
              const existingExtraTime = await this.prisma.matchExtraPeriod.findFirst({
                where: { match_id: dbMatch.id, type: 'extra_time' },
              });

              const totalHome = scoreARegular + scoreAExtra;
              const totalAway = scoreBRegular + scoreBExtra;
              let winnerTeamId: string | null = null;
              if (totalHome > totalAway) {
                winnerTeamId = teamA.id;
              } else if (totalAway > totalHome) {
                winnerTeamId = teamB.id;
              }

              if (existingExtraTime) {
                await this.prisma.matchExtraPeriod.update({
                  where: { id: existingExtraTime.id },
                  data: { winner_team_id: winnerTeamId },
                });
              } else {
                await this.prisma.matchExtraPeriod.create({
                  data: {
                    match_id: dbMatch.id,
                    type: 'extra_time',
                    winner_team_id: winnerTeamId,
                    started_at: new Date(),
                  },
                });
              }
            }

            if (scoreInfo.duration === 'PENALTY_SHOOTOUT') {
              const existingPenalties = await this.prisma.matchExtraPeriod.findFirst({
                where: { match_id: dbMatch.id, type: 'penalties' },
              });

              let winnerTeamId: string | null = null;
              if (penaltyScoreA !== null && penaltyScoreB !== null) {
                if (penaltyScoreA > penaltyScoreB) {
                  winnerTeamId = teamA.id;
                } else if (penaltyScoreB > penaltyScoreA) {
                  winnerTeamId = teamB.id;
                }
              }

              if (existingPenalties) {
                await this.prisma.matchExtraPeriod.update({
                  where: { id: existingPenalties.id },
                  data: {
                    penalty_score_a: penaltyScoreA,
                    penalty_score_b: penaltyScoreB,
                    winner_team_id: winnerTeamId,
                  },
                });
              } else {
                await this.prisma.matchExtraPeriod.create({
                  data: {
                    match_id: dbMatch.id,
                    type: 'penalties',
                    penalty_score_a: penaltyScoreA,
                    penalty_score_b: penaltyScoreB,
                    winner_team_id: winnerTeamId,
                    started_at: new Date(),
                  },
                });
              }
            }

            // Perform the update (triggers scoring & rankings recalculation if finished)
            await this.matchesService.update(dbMatch.id, {
              status: mappedStatus,
              score_a: scoreARegular,
              score_b: scoreBRegular,
              score_a_extra: scoreAExtra,
              score_b_extra: scoreBExtra,
              penalty_score_a: penaltyScoreA,
              penalty_score_b: penaltyScoreB,
            });
          }

          updatedCount++;
        }
      }

      const summaryMsg = `Processed ${data.matches.length} matches. Matched with DB: ${matchedCount}. Updated: ${updatedCount}.`;
      return {
        success: true,
        message: summaryMsg,
        details: {
          matchedCount,
          updatedCount,
          updates: updatesLog,
        },
      };
    } catch (error: any) {
      const errorMsg = `Sync failed due to error: ${error.message}`;
      this.logger.error(errorMsg, error.stack);
      return { success: false, message: errorMsg };
    }
  }
}
