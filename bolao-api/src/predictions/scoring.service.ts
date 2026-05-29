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

    const score = await this.matchesService.getScore(prediction.match_id);

    const extraPeriods = await this.prisma.matchExtraPeriod.findMany({
      where: { match_id: prediction.match_id },
    });

    // Get first goal event for this match
    const firstGoal = await this.prisma.matchEvent.findFirst({
      where: {
        match_id: prediction.match_id,
        type: 'goal',
      },
      orderBy: { minute: 'asc' },
    });

    // Extract prediction values
    const items = hydratePredictionItems(prediction.items as any);
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

    const actualScoreA = score.score_a;
    const actualScoreB = score.score_b;

    const pointsToInsert: { type: string; pts_earned: number }[] = [];

    // --- Scoring Rules ---

    // Exact score: 10 pts
    if (predScoreA !== null && predScoreB !== null &&
        predScoreA === actualScoreA && predScoreB === actualScoreB) {
      pointsToInsert.push({ type: 'exact_score', pts_earned: 10 });
    }

    // Goals A correct: 3 pts
    if (predScoreA !== null && predScoreA === actualScoreA) {
      pointsToInsert.push({ type: 'goals_a', pts_earned: 3 });
    }

    // Goals B correct: 3 pts
    if (predScoreB !== null && predScoreB === actualScoreB) {
      pointsToInsert.push({ type: 'goals_b', pts_earned: 3 });
    }

    // Result correct (win/draw/loss): 4 pts
    if (predScoreA !== null && predScoreB !== null) {
      const predResult = Math.sign(predScoreA - predScoreB);
      const actualResult = Math.sign(actualScoreA - actualScoreB);
      if (predResult === actualResult) {
        pointsToInsert.push({ type: 'result', pts_earned: 4 });
      }
    }

    // Total goals correct: 1 pt
    if (predScoreA !== null && predScoreB !== null &&
        (predScoreA + predScoreB) === (actualScoreA + actualScoreB)) {
      pointsToInsert.push({ type: 'total_goals', pts_earned: 1 });
    }

    // First goal player correct: 8 pts
    if (predFirstGoalPlayer && firstGoal && firstGoal.player_id === predFirstGoalPlayer) {
      pointsToInsert.push({ type: 'first_goal_player', pts_earned: 8 });
    }

    // First goal team correct (no player match): 3 pts
    if (predFirstGoalTeam && firstGoal && firstGoal.team_id === predFirstGoalTeam) {
      // Only award if the player wasn't already matched
      const alreadyMatchedPlayer = pointsToInsert.find((p) => p.type === 'first_goal_player');
      if (!alreadyMatchedPlayer) {
        pointsToInsert.push({ type: 'first_goal_team', pts_earned: 3 });
      }
    }

    // Bonus 0x0: 3 pts
    if (predScoreA === 0 && predScoreB === 0 &&
        actualScoreA === 0 && actualScoreB === 0) {
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
