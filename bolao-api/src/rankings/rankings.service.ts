import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async recalculate(tournamentId: string, phaseId?: string | null) {
    // Get all predictions for matches in this tournament (and optionally phase)
    const matches = await this.prisma.match.findMany({
      where: {
        phase: {
          tournament_id: tournamentId,
          ...(phaseId ? { id: phaseId } : {}),
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

    const userPoints: Record<string, { pts_total: number; pts_matches: number }> = {};

    for (const prediction of predictions) {
      if (!userPoints[prediction.user_id]) {
        userPoints[prediction.user_id] = { pts_total: 0, pts_matches: 0 };
      }
      const total = prediction.points.reduce((sum, p) => sum + p.pts_earned, 0);
      userPoints[prediction.user_id].pts_total += total;
      userPoints[prediction.user_id].pts_matches += 1;
    }

    // Sort users by total points
    const sortedUsers = Object.entries(userPoints).sort(
      ([, a], [, b]) => b.pts_total - a.pts_total,
    );

    // Update rankings with position
    let position = 1;
    for (let i = 0; i < sortedUsers.length; i++) {
      if (i > 0) {
        const [, prevPoints] = sortedUsers[i - 1];
        const [, currPoints] = sortedUsers[i];
        if (currPoints.pts_total < prevPoints.pts_total) {
          position = i + 1;
        }
        // Tied users keep the same position
      }

      const [userId, points] = sortedUsers[i];

      const existingRanking = await this.prisma.ranking.findFirst({
        where: {
          user_id: userId,
          tournament_id: tournamentId,
          phase_id: phaseId ?? null,
        },
      });

      if (existingRanking) {
        await this.prisma.ranking.update({
          where: { id: existingRanking.id },
          data: {
            pts_total: points.pts_total,
            pts_matches: points.pts_matches,
            position,
          },
        });
      } else {
        await this.prisma.ranking.create({
          data: {
            user_id: userId,
            tournament_id: tournamentId,
            phase_id: phaseId ?? null,
            pts_total: points.pts_total,
            pts_matches: points.pts_matches,
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
        phase_id: phaseId ?? null,
      },
      include: {
        user: true,
      },
      orderBy: [
        { pts_total: 'desc' },
        { user: { name: 'asc' } },
      ],
    });

    // Handle tied positions
    let currentPosition = 1;
    const result = rankings.map((r, i) => {
      if (i > 0 && rankings[i].pts_total < rankings[i - 1].pts_total) {
        currentPosition = i + 1;
      }
      return {
        position: currentPosition,
        user_id: r.user_id,
        user_name: r.user.name,
        user_avatar: r.user.avatar_url,
        pts_total: r.pts_total,
        pts_matches: r.pts_matches,
      };
    });

    return result;
  }
}
