import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesService } from '../matches/matches.service';
import { hydratePredictionItems } from './prediction-item.crypto';

@Injectable()
export class ScoringService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MatchesService))
    private matchesService: MatchesService,
  ) {}

  async calculateMatchPoints(predictionId: string): Promise<number> {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id: predictionId },
      include: { items: true },
    });

    if (!prediction) return 0;

    const match = await this.prisma.match.findUnique({
      where: { id: prediction.match_id },
      include: {
        phase: {
          include: {
            tournament: true,
          },
        },
      },
    });

    if (!match) return 0;

    const score = await this.matchesService.getScore(prediction.match_id);

    const extraPeriods = await this.prisma.matchExtraPeriod.findMany({
      where: { match_id: prediction.match_id },
    });

    // Extract prediction values
    const items = hydratePredictionItems(prediction.items);
    const getItemInt = (type: string) =>
      items.find((i) => i.type === type)?.value_int ?? null;
    const getItemTeamId = (type: string) =>
      items.find((i) => i.type === type)?.value_team_id ?? null;
    const getItemPlayerId = (type: string) =>
      items.find((i) => i.type === type)?.value_player_id ?? null;

    const predScoreA = getItemInt('score_a');
    const predScoreB = getItemInt('score_b');
    const predFirstGoalTeam = getItemTeamId('first_goal_team');
    const predFirstGoalPlayer = getItemPlayerId('first_goal_player');
    const predExtraTime = getItemInt('went_to_extra_time');
    const predPenalties = getItemInt('went_to_penalties');
    
    // New Multipliers
    const predScorerPlayerId = getItemPlayerId('scorer_player');
    const predCardsQty = getItemInt('cards_quantity');
    const predCornersQty = getItemInt('corners_quantity');
    const predBothTeamsScore = getItemInt('both_teams_score');

    const actualScoreA = score.score_a;
    const actualScoreB = score.score_b;

    const pointsToInsert: { type: string; pts_earned: number }[] = [];

    // --- Scoring Rules ---

    // --- Scoring Rules (Mutually Exclusive) ---
    if (predScoreA !== null && predScoreB !== null) {
      const isExactScore =
         predScoreA === actualScoreA && predScoreB === actualScoreB;
      const predResult = Math.sign(predScoreA - predScoreB);
      const actualResult = Math.sign(actualScoreA - actualScoreB);
      const isResultCorrect = predResult === actualResult;

      if (isExactScore) {
        pointsToInsert.push({ type: 'exact_score', pts_earned: 10 });
      } else if (isResultCorrect) {
        pointsToInsert.push({ type: 'result', pts_earned: 6 });
      } else {
        if (predScoreA === actualScoreA) {
          pointsToInsert.push({ type: 'goals_a', pts_earned: 1 });
        }
        if (predScoreB === actualScoreB) {
          pointsToInsert.push({ type: 'goals_b', pts_earned: 1 });
        }
      }
    }

    // Bonus 0x0: 3 pts
    if (
      predScoreA === 0 &&
      predScoreB === 0 &&
      actualScoreA === 0 &&
      actualScoreB === 0
    ) {
      pointsToInsert.push({ type: 'bonus_zero_zero', pts_earned: 3 });
    }

    // Bonus extra time: 3 pts
    const wentToExtraTime = extraPeriods.some((ep) => ep.type === 'extra_time');
    if (predExtraTime === 1 && wentToExtraTime) {
      pointsToInsert.push({ type: 'bonus_extra_time', pts_earned: 3 });
    }

    // Bonus penalties: 5 pts
    const wentToPenalties = extraPeriods.some((ep) => ep.type === 'penalties');
    if (predPenalties === 1 && wentToPenalties) {
      pointsToInsert.push({ type: 'bonus_penalties', pts_earned: 5 });
    }

    // --- Multiplier Calculations (If Active) ---
    const tournament = match.phase?.tournament;
    if (tournament && tournament.multipliers_active) {
      // 1. Jogador que marca gol (pts)
      if (predScorerPlayerId) {
        const actualScorer = await this.prisma.matchEvent.findFirst({
          where: {
            match_id: match.id,
            type: 'goal',
            player_id: predScorerPlayerId,
          },
        });
        if (actualScorer) {
          pointsToInsert.push({
            type: 'multiplier_scorer',
            pts_earned: tournament.multiplier_scorer_pts,
          });
        }
      }

      // 2. Primeiro time a marcar (pts)
      if (predFirstGoalTeam) {
        const firstGoalEvent = await this.prisma.matchEvent.findFirst({
          where: {
            match_id: match.id,
            type: { in: ['goal', 'own_goal'] },
          },
          orderBy: { minute: 'asc' },
        });
        let actualFirstGoalTeamId: string | null = null;
        if (firstGoalEvent) {
          if (firstGoalEvent.type === 'goal') {
            actualFirstGoalTeamId = firstGoalEvent.team_id;
          } else {
            // Own goal: opposing team gets the score
            actualFirstGoalTeamId =
              firstGoalEvent.team_id === match.team_a_id
                ? match.team_b_id
                : match.team_a_id;
          }
        }
        if (actualFirstGoalTeamId && predFirstGoalTeam === actualFirstGoalTeamId) {
          pointsToInsert.push({
            type: 'multiplier_first_goal',
            pts_earned: tournament.multiplier_first_goal_pts,
          });
        }
      }

      // 3. Quantidade de cartões (pts)
      if (predCardsQty !== null && predCardsQty === match.cards_quantity) {
        pointsToInsert.push({
          type: 'multiplier_cards',
          pts_earned: tournament.multiplier_cards_pts,
        });
      }

      // 4. Quantidade de escanteios (pts)
      if (predCornersQty !== null && predCornersQty === match.corners_quantity) {
        pointsToInsert.push({
          type: 'multiplier_corners',
          pts_earned: tournament.multiplier_corners_pts,
        });
      }

      // 5. Ambos os times marcam (pts)
      if (predBothTeamsScore !== null) {
        const actualBothTeamsScore =
          match.score_a > 0 && match.score_b > 0 ? 1 : 0;
        if (predBothTeamsScore === actualBothTeamsScore) {
          pointsToInsert.push({
            type: 'multiplier_both_score',
            pts_earned: tournament.multiplier_both_score_pts,
          });
        }
      }
    }

    // Delete existing points for this prediction
    await this.prisma.predictionPoint.deleteMany({
      where: { prediction_id: predictionId },
    });

    // Insert new points
    if (pointsToInsert.length > 0) {
      await this.prisma.predictionPoint.createMany({
        data: pointsToInsert.map((p) => ({
          prediction_id: predictionId,
          type: p.type as any,
          pts_earned: p.pts_earned,
        })),
      });
    }

    return pointsToInsert.reduce((sum, p) => sum + p.pts_earned, 0);
  }

  async recalculateMatch(matchId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: { match_id: matchId },
    });

    for (const prediction of predictions) {
      await this.calculateMatchPoints(prediction.id);
    }
  }
}
