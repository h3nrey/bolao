import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointType } from '@prisma/client';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async recalculate(tournamentId: string, phaseId?: string | null) {
    // Get all predictions for matches in this tournament (all phases)
    const matches = await this.prisma.match.findMany({
      where: {
        phase: {
          tournament_id: tournamentId,
        },
      },
    });

    const matchIds = matches.map((m) => m.id);

    if (matchIds.length === 0) return;

    // Aggregate points per user
    const predictions = await this.prisma.prediction.findMany({
      where: { match_id: { in: matchIds } },
      include: { points: true },
    });

    const userStats: Record<
      string,
      {
        userName: string;
        pts_total: number;
        pts_matches: number;
        exact_scores_count: number;
        sum_submitted_at: number;
      }
    > = {};

    // Initialize stats for ALL users
    const allUsers = await this.prisma.user.findMany();
    const farFutureTime = new Date('2099-01-01').getTime();

    for (const user of allUsers) {
      userStats[user.id] = {
        userName: user.name,
        pts_total: 0,
        pts_matches: 0,
        exact_scores_count: 0,
        sum_submitted_at: matchIds.length * farFutureTime, // Initialize all matches with far-future penalty
      };
    }

    for (const prediction of predictions) {
      const userId = prediction.user_id;
      if (!userStats[userId]) {
        const user = allUsers.find((u) => u.id === userId);
        userStats[userId] = {
          userName: user?.name ?? 'Unknown',
          pts_total: 0,
          pts_matches: 0,
          exact_scores_count: 0,
          sum_submitted_at: matchIds.length * farFutureTime,
        };
      }
      const total = prediction.points.reduce((sum, p) => sum + p.pts_earned, 0);
      userStats[userId].pts_total += total;
      userStats[userId].pts_matches += 1;

      // Count exact scores (point type 'exact_score' with > 0 pts)
      const exactPointsCount = prediction.points.filter(
        (p) => p.type === PointType.exact_score && p.pts_earned > 0,
      ).length;
      userStats[userId].exact_scores_count += exactPointsCount;

      // Replace the far-future default for this match with the actual prediction submitted_at timestamp
      const submitTime = prediction.submitted_at
        ? new Date(prediction.submitted_at).getTime()
        : farFutureTime;
      userStats[userId].sum_submitted_at =
        userStats[userId].sum_submitted_at - farFutureTime + submitTime;
    }

    // Add special predictions points
    for (const user of allUsers) {
      const specialPoints = await this.calculateSpecialPoints(
        user.id,
        tournamentId,
      );
      userStats[user.id].pts_total += specialPoints;
    }

    // Sort users:
    // 1. Total points descending
    // 2. Tie-breaker: exact scores count descending
    // 3. Tie-breaker: sum of submission times ascending (earlier is better)
    // 4. Stable sort: alphabetical by user name (case-insensitive, Portuguese rules)
    const sortedUsers = Object.entries(userStats).sort((entryA, entryB) => {
      const [, a] = entryA;
      const [, b] = entryB;

      if (b.pts_total !== a.pts_total) {
        return b.pts_total - a.pts_total;
      }
      if (b.exact_scores_count !== a.exact_scores_count) {
        return b.exact_scores_count - a.exact_scores_count;
      }
      if (a.sum_submitted_at !== b.sum_submitted_at) {
        return a.sum_submitted_at - b.sum_submitted_at;
      }
      return a.userName.localeCompare(b.userName, 'pt', { sensitivity: 'base' });
    });

    // Update rankings in database with sequential position (no tied positions allowed)
    for (let i = 0; i < sortedUsers.length; i++) {
      const position = i + 1;
      const [userId, stats] = sortedUsers[i];

      const existingRanking = await this.prisma.ranking.findFirst({
        where: {
          user_id: userId,
          tournament_id: tournamentId,
          phase_id: null,
        },
      });

      if (existingRanking) {
        await this.prisma.ranking.update({
          where: { id: existingRanking.id },
          data: {
            pts_total: stats.pts_total,
            pts_matches: stats.pts_matches,
            position,
          },
        });
      } else {
        await this.prisma.ranking.create({
          data: {
            user_id: userId,
            tournament_id: tournamentId,
            phase_id: null,
            pts_total: stats.pts_total,
            pts_matches: stats.pts_matches,
            position,
          },
        });
      }
    }
  }

  async getFormatted(tournamentId: string, phaseId?: string) {
    const rankings = await this.prisma.ranking.findMany({
      where: {
        tournament_id: tournamentId,
        phase_id: null, // Always return the overall ranking
      },
      include: {
        user: true,
      },
      orderBy: { position: 'asc' },
    });

    return rankings.map((r) => ({
      position: r.position,
      user_id: r.user_id,
      user_name: r.user.name,
      user_avatar: r.user.avatar_url,
      user_project: r.user.project,
      user_seniority: r.user.seniority,
      pts_total: r.pts_total,
      pts_matches: r.pts_matches,
    }));
  }

  private async calculateSpecialPoints(
    userId: string,
    tournamentId: string,
  ): Promise<number> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) return 0;

    const pred = await this.prisma.specialPrediction.findUnique({
      where: { user_id: userId },
    });
    if (!pred) return 0;

    let pts = 0;
    if (
      tournament.champion_team_id &&
      pred.champion_team_id === tournament.champion_team_id
    ) {
      pts += 30;
    }
    if (
      tournament.runner_up_team_id &&
      pred.runner_up_team_id === tournament.runner_up_team_id
    ) {
      pts += 20;
    }
    if (
      tournament.third_place_team_id &&
      pred.third_place_team_id === tournament.third_place_team_id
    ) {
      pts += 20;
    }
    if (
      tournament.top_scorer_player_id &&
      pred.top_scorer_player_id === tournament.top_scorer_player_id
    ) {
      pts += 20;
    }
    if (
      tournament.best_player_player_id &&
      pred.best_player_player_id === tournament.best_player_player_id
    ) {
      pts += 20;
    }
    if (
      tournament.surprise_team_id &&
      pred.surprise_team_id === tournament.surprise_team_id
    ) {
      pts += 20;
    }
    return pts;
  }
}
