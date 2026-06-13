import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/match.dto';
import {
  CreateExtraPeriodDto,
  UpdateExtraPeriodDto,
} from './dto/match-extra-period.dto';
import { ScoringService } from '../predictions/scoring.service';
import { RankingsService } from '../rankings/rankings.service';
import { calculateCommunityTrends } from './matches.helper';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ScoringService))
    private scoringService: ScoringService,
    private rankingsService: RankingsService,
  ) {}

  async findAll(
    phaseId?: string,
    status?: string,
    groupId?: string,
    sort?: 'status' | 'chronological',
  ) {
    const where: any = {};
    if (phaseId) where.phase_id = phaseId;
    if (status) where.status = status;
    if (groupId) where.group_id = groupId;

    const matches = await this.prisma.match.findMany({
      where,
      orderBy: { scheduled_at: 'asc' },
      include: {
        team_a: true,
        team_b: true,
        group: true,
      },
    });

    const mapped = matches.map((match) => {
      const currentMinute = this.getCurrentMinute(match);
      return {
        ...match,
        score: {
          score_a: match.score_a + match.score_a_extra,
          score_b: match.score_b + match.score_b_extra,
          score_a_regular: match.score_a,
          score_b_regular: match.score_b,
          score_a_extra: match.score_a_extra,
          score_b_extra: match.score_b_extra,
        },
        current_minute: currentMinute,
      };
    });

    if (sort === 'status') {
      return mapped.sort((a, b) => {
        const order: Record<string, number> = {
          live: 0,
          upcoming: 1,
          finished: 2,
          cancelled: 3,
        };
        const oa = order[a.status] ?? 4,
          ob = order[b.status] ?? 4;
        if (oa !== ob) return oa - ob;
        const da = new Date(a.scheduled_at).getTime(),
          db = new Date(b.scheduled_at).getTime();
        return a.status === 'finished' ? db - da : da - db;
      });
    }

    return mapped;
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
    const predictions = await this.prisma.prediction.findMany({
      where: { match_id: id },
      include: { items: true },
    });

    const predictionsCount = predictions.length;
    const communityTrends = calculateCommunityTrends(predictions);

    return {
      ...match,
      score,
      current_minute: currentMinute,
      predictions_count: predictionsCount,
      community_trends: communityTrends,
    };
  }

  async create(phaseId: string, dto: CreateMatchDto) {
    const phase = await this.prisma.phase.findUnique({
      where: { id: phaseId },
    });
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
    await this.rankingsService.recalculate(
      match.phase.tournament_id,
      match.phase_id,
    );

    return updatedMatch;
  }

  async getScore(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return {
      score_a: match.score_a + match.score_a_extra,
      score_b: match.score_b + match.score_b_extra,
      score_a_regular: match.score_a,
      score_b_regular: match.score_b,
      score_a_extra: match.score_a_extra,
      score_b_extra: match.score_b_extra,
    };
  }

  getCurrentMinute(match: any) {
    if (match.status !== 'live' || !match.started_at) {
      return null;
    }
    return Math.floor(
      (Date.now() - new Date(match.started_at).getTime()) / 60000,
    );
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
    await this.rankingsService.recalculate(
      match.phase.tournament_id,
      match.phase_id,
    );

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
      extraPeriod.match.phase.id,
    );

    return updated;
  }

  async update(id: string, dto: any) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { phase: true },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const updatedDto = { ...dto };
    if (
      ((dto.score_a !== undefined && dto.score_a !== match.score_a) ||
       (dto.score_b !== undefined && dto.score_b !== match.score_b) ||
       (dto.score_a_extra !== undefined && dto.score_a_extra !== match.score_a_extra) ||
       (dto.score_b_extra !== undefined && dto.score_b_extra !== match.score_b_extra)) &&
      match.status !== 'finished' &&
      dto.status !== 'cancelled'
    ) {
      updatedDto.status = 'finished';
    }

    const updated = await this.prisma.match.update({
      where: { id },
      data: updatedDto,
      include: { phase: true },
    });

    if (updated.status === 'finished') {
      await this.scoringService.recalculateMatch(id);
      await this.rankingsService.recalculate(
        updated.phase.tournament_id,
        updated.phase_id,
      );
    }

    return updated;
  }

  async remove(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { phase: true },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete BracketSlot referencing the match
      await tx.bracketSlot.deleteMany({
        where: { match_id: id },
      });

      // 2. Delete Predictions and their points/items
      const predictions = await tx.prediction.findMany({
        where: { match_id: id },
        select: { id: true },
      });
      const predictionIds = predictions.map((p) => p.id);

      if (predictionIds.length > 0) {
        await tx.predictionPoint.deleteMany({
          where: { prediction_id: { in: predictionIds } },
        });
        await tx.predictionItem.deleteMany({
          where: { prediction_id: { in: predictionIds } },
        });
        await tx.prediction.deleteMany({
          where: { id: { in: predictionIds } },
        });
      }

      // 3. Delete MatchExtraPeriods and MatchEvents
      await tx.matchExtraPeriod.deleteMany({
        where: { match_id: id },
      });
      await tx.matchEvent.deleteMany({
        where: { match_id: id },
      });

      // 4. Delete the match itself
      await tx.match.delete({
        where: { id },
      });

      // 5. Recalculate rankings
      await this.rankingsService.recalculate(
        match.phase.tournament_id,
        match.phase_id,
      );

      return { success: true };
    });
  }
}
