import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchEventDto } from './dto/match-event.dto';
import { ScoringService } from '../predictions/scoring.service';
import { RankingsService } from '../rankings/rankings.service';

@Injectable()
export class MatchEventsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ScoringService))
    private scoringService: ScoringService,
    private rankingsService: RankingsService,
  ) {}

  async findAllForMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.prisma.matchEvent.findMany({
      where: { match_id: matchId },
      orderBy: { minute: 'asc' },
      include: {
        player: true,
        team: true,
      },
    });
  }

  async create(matchId: string, dto: CreateMatchEventDto) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { phase: true },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const event = await this.prisma.matchEvent.create({
      data: {
        ...dto,
        match_id: matchId,
      },
    });

    await this.scoringService.recalculateMatch(matchId);
    await this.rankingsService.recalculate(match.phase.tournament_id, match.phase_id);

    return event;
  }

  async remove(id: string) {
    const event = await this.prisma.matchEvent.findUnique({
      where: { id },
      include: {
        match: {
          include: { phase: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Match event not found');
    }

    await this.prisma.matchEvent.delete({
      where: { id },
    });

    await this.scoringService.recalculateMatch(event.match_id);
    await this.rankingsService.recalculate(event.match.phase.tournament_id, event.match.phase_id);

    return { success: true };
  }
}
