import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/match.dto';
import { CreateExtraPeriodDto, UpdateExtraPeriodDto } from './dto/match-extra-period.dto';
import { ScoringService } from '../predictions/scoring.service';
import { RankingsService } from '../rankings/rankings.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ScoringService))
    private scoringService: ScoringService,
    private rankingsService: RankingsService,
  ) {}

  async findAll(phaseId?: string, status?: string, groupId?: string) {
    const where: any = {};
    if (phaseId) where.phase_id = phaseId;
    if (status) where.status = status;
    if (groupId) where.group_id = groupId;

    const matches = await this.prisma.match.findMany({
      where,
      include: {
        team_a: true,
        team_b: true,
      },
    });

    const result: any[] = [];
    for (const match of matches) {
      const score = await this.getScore(match.id);
      const currentMinute = this.getCurrentMinute(match);
      result.push({
        ...match,
        score,
        current_minute: currentMinute,
      });
    }

    return result;
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        phase: true,
        group: true,
        team_a: true,
        team_b: true,
        events: {
          orderBy: { minute: 'asc' },
          include: { player: true, team: true },
        },
        extra_periods: {
          include: { winner_team: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const score = await this.getScore(id);
    const currentMinute = this.getCurrentMinute(match);
    const predictionsCount = await this.prisma.prediction.count({
      where: { match_id: id },
    });

    return {
      ...match,
      score,
      current_minute: currentMinute,
      predictions_count: predictionsCount,
    };
  }

  async create(phaseId: string, dto: CreateMatchDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    return this.prisma.match.create({
      data: {
        ...dto,
        phase_id: phaseId,
      },
    });
  }

  async start(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.prisma.match.update({
      where: { id },
      data: {
        started_at: new Date(),
        status: 'live',
      },
    });
  }

  async end(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { phase: true },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: {
        ended_at: new Date(),
        status: 'finished',
      },
    });

    await this.scoringService.recalculateMatch(id);
    await this.rankingsService.recalculate(match.phase.tournament_id, match.phase_id);

    return updatedMatch;
  }

  async getScore(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const events = await this.prisma.matchEvent.findMany({
      where: {
        match_id: matchId,
        type: { in: ['goal', 'own_goal'] },
      },
    });

    let score_a_regular = 0;
    let score_b_regular = 0;
    let score_a_extra = 0;
    let score_b_extra = 0;

    for (const event of events) {
      const isTeamA = event.team_id === match.team_a_id;
      const isTeamB = event.team_id === match.team_b_id;

      if (event.period === 'regular') {
        if (event.type === 'goal') {
          if (isTeamA) score_a_regular++;
          else if (isTeamB) score_b_regular++;
        } else if (event.type === 'own_goal') {
          if (isTeamA) score_b_regular++;
          else if (isTeamB) score_a_regular++;
        }
      } else if (event.period === 'extra_time') {
        if (event.type === 'goal') {
          if (isTeamA) score_a_extra++;
          else if (isTeamB) score_b_extra++;
        } else if (event.type === 'own_goal') {
          if (isTeamA) score_b_extra++;
          else if (isTeamB) score_a_extra++;
        }
      }
    }

    const score_a = score_a_regular + score_a_extra;
    const score_b = score_b_regular + score_b_extra;

    return {
      score_a,
      score_b,
      score_a_regular,
      score_b_regular,
      score_a_extra,
      score_b_extra,
    };
  }

  getCurrentMinute(match: any) {
    if (match.status !== 'live' || !match.started_at) {
      return null;
    }
    return Math.floor((Date.now() - new Date(match.started_at).getTime()) / 60000);
  }

  async createExtraPeriod(matchId: string, dto: CreateExtraPeriodDto) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { phase: true },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const extraPeriod = await this.prisma.matchExtraPeriod.create({
      data: {
        match_id: matchId,
        type: dto.type,
        started_at: new Date(),
      },
    });

    await this.scoringService.recalculateMatch(matchId);
    await this.rankingsService.recalculate(match.phase.tournament_id, match.phase_id);

    return extraPeriod;
  }

  async updateExtraPeriod(id: string, dto: UpdateExtraPeriodDto) {
    const extraPeriod = await this.prisma.matchExtraPeriod.findUnique({
      where: { id },
      include: {
        match: {
          include: { phase: true },
        },
      },
    });
    if (!extraPeriod) {
      throw new NotFoundException('Extra period not found');
    }

    const updated = await this.prisma.matchExtraPeriod.update({
      where: { id },
      data: dto,
    });

    await this.scoringService.recalculateMatch(extraPeriod.match_id);
    await this.rankingsService.recalculate(
      extraPeriod.match.phase.tournament_id,
      extraPeriod.match.phase_id,
    );

    return updated;
  }
}
