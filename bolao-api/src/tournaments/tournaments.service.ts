import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto, UpdateTournamentDto } from './dto/tournament.dto';
import { hydratePredictionItems } from '../predictions/prediction-item.crypto';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tournament.findMany();
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { phases: true },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    return tournament;
  }

  async getAuditData(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { phases: true },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const phaseIds = tournament.phases.map((p) => p.id);

    // Fetch finished and live matches with teams
    const matches = await this.prisma.match.findMany({
      where: {
        phase_id: { in: phaseIds },
        status: { in: ['finished', 'live'] },
      },
      include: {
        team_a: true,
        team_b: true,
        extra_periods: true,
      },
      orderBy: { scheduled_at: 'asc' },
    });

    const matchIds = matches.map((m) => m.id);

    // Fetch all users
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    // Fetch all predictions for these matches, with items and points
    const predictions = await this.prisma.prediction.findMany({
      where: {
        match_id: { in: matchIds },
      },
      include: {
        items: true,
        points: true,
      },
    });

    const calculateLiveMatchPoints = (predItems: any[], match: any, extraPeriods: any[]) => {
      const getItemInt = (type: string) =>
        predItems.find((i) => i.type === type)?.value_int ?? null;

      const predScoreA = getItemInt('score_a');
      const predScoreB = getItemInt('score_b');
      const predExtraTime = getItemInt('went_to_extra_time');
      const predPenalties = getItemInt('went_to_penalties');

      if (predScoreA === null || predScoreB === null) return 0;

      const actualScoreA = match.score_a + match.score_a_extra;
      const actualScoreB = match.score_b + match.score_b_extra;

      const isExactScore = predScoreA === actualScoreA && predScoreB === actualScoreB;
      const predResult = Math.sign(predScoreA - predScoreB);
      const actualResult = Math.sign(actualScoreA - actualScoreB);
      const isResultCorrect = predResult === actualResult;

      let pts = 0;

      if (isExactScore) {
        pts += 10;
      } else {
        if (isResultCorrect) pts += 5;
        if (predScoreA === actualScoreA) pts += 2;
        if (predScoreB === actualScoreB) pts += 2;
        if (predScoreA + predScoreB === actualScoreA + actualScoreB) pts += 2;
      }

      // Bonus 0x0
      if (
        predScoreA === 0 &&
        predScoreB === 0 &&
        actualScoreA === 0 &&
        actualScoreB === 0
      ) {
        pts += 3;
      }

      // Bonus extra time
      const wentToExtraTime = extraPeriods.some((ep) => ep.type === 'extra_time');
      if (predExtraTime === 1 && wentToExtraTime) {
        pts += 3;
      }

      // Bonus penalties
      const wentToPenalties = extraPeriods.some((ep) => ep.type === 'penalties');
      if (predPenalties === 1 && wentToPenalties) {
        pts += 5;
      }

      return pts;
    };

    // Construct user predictions map
    const userPredictionsMap = new Map<string, Record<string, any>>();

    for (const pred of predictions) {
      const hydratedItems = hydratePredictionItems(pred.items);
      const scoreA = hydratedItems.find((i) => i.type === 'score_a')?.value_int ?? null;
      const scoreB = hydratedItems.find((i) => i.type === 'score_b')?.value_int ?? null;
      
      const match = matches.find((m) => m.id === pred.match_id);
      if (!match) continue;

      let totalPoints = 0;
      if (match.status === 'live') {
        totalPoints = calculateLiveMatchPoints(hydratedItems, match, match.extra_periods || []);
      } else {
        totalPoints = pred.points.reduce((sum, p) => sum + p.pts_earned, 0);
      }

      if (!userPredictionsMap.has(pred.user_id)) {
        userPredictionsMap.set(pred.user_id, {});
      }

      userPredictionsMap.get(pred.user_id)![pred.match_id] = {
        score_a: scoreA,
        score_b: scoreB,
        points: totalPoints,
      };
    }

    // Fetch all special predictions for the tournament
    const specialPredictions = await this.prisma.specialPrediction.findMany();
    const specialPredictionsMap = new Map(specialPredictions.map((sp) => [sp.user_id, sp]));

    const getSpecialPoints = (specialPred: any, tournament: any) => {
      if (!specialPred) return 0;
      let pts = 0;
      if (
        tournament.champion_team_id &&
        specialPred.champion_team_id === tournament.champion_team_id
      ) {
        pts += 30;
      }
      if (
        tournament.runner_up_team_id &&
        specialPred.runner_up_team_id === tournament.runner_up_team_id
      ) {
        pts += 20;
      }
      if (
        tournament.third_place_team_id &&
        specialPred.third_place_team_id === tournament.third_place_team_id
      ) {
        pts += 20;
      }
      if (
        tournament.top_scorer_player_id &&
        specialPred.top_scorer_player_id === tournament.top_scorer_player_id
      ) {
        pts += 20;
      }
      if (
        tournament.best_player_player_id &&
        specialPred.best_player_player_id === tournament.best_player_player_id
      ) {
        pts += 20;
      }
      if (
        tournament.surprise_team_id &&
        specialPred.surprise_team_id === tournament.surprise_team_id
      ) {
        pts += 20;
      }
      return pts;
    };

    const auditUsers = users
      .filter((u) => userPredictionsMap.has(u.id))
      .map((u) => {
        const userPreds = userPredictionsMap.get(u.id) || {};
        
        let totalMatchesPoints = 0;
        for (const match of matches) {
          const pred = userPreds[match.id];
          if (pred) {
            totalMatchesPoints += pred.points;
          }
        }

        const specialPred = specialPredictionsMap.get(u.id);
        const specialPoints = getSpecialPoints(specialPred, tournament);

        const pts_total = totalMatchesPoints + specialPoints;

        return {
          id: u.id,
          name: u.name,
          pts_total: pts_total,
          predictions: userPreds,
        };
      });

    // Sort by points descending, then by name alphabetically
    auditUsers.sort((a, b) => {
      if (b.pts_total !== a.pts_total) {
        return b.pts_total - a.pts_total;
      }
      return a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' });
    });

    return {
      matches: matches.map((m) => ({
        id: m.id,
        team_a: m.team_a?.name || '?',
        team_b: m.team_b?.name || '?',
        score_a: m.score_a + m.score_a_extra,
        score_b: m.score_b + m.score_b_extra,
        status: m.status,
        scheduled_at: m.scheduled_at,
      })),
      users: auditUsers,
    };
  }

  async create(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateTournamentDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    return this.prisma.tournament.update({
      where: { id },
      data: dto,
    });
  }
}
