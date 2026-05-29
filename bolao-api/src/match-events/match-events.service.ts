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

    // Update match cached scores!
    if (dto.type === 'goal' || dto.type === 'own_goal') {
      const isTeamA = dto.team_id === match.team_a_id;
      const isTeamB = dto.team_id === match.team_b_id;
      
      let updateData: any = {};
      if (dto.period === 'regular') {
        if (dto.type === 'goal') {
          if (isTeamA) updateData.score_a = { increment: 1 };
          else if (isTeamB) updateData.score_b = { increment: 1 };
        } else if (dto.type === 'own_goal') {
          if (isTeamA) updateData.score_b = { increment: 1 };
          else if (isTeamB) updateData.score_a = { increment: 1 };
        }
      } else if (dto.period === 'extra_time') {
        if (dto.type === 'goal') {
          if (isTeamA) updateData.score_a_extra = { increment: 1 };
          else if (isTeamB) updateData.score_b_extra = { increment: 1 };
        } else if (dto.type === 'own_goal') {
          if (isTeamA) updateData.score_b_extra = { increment: 1 };
          else if (isTeamB) updateData.score_a_extra = { increment: 1 };
        }
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.match.update({
          where: { id: matchId },
          data: updateData,
        });
      }
    }

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

    // Update match cached scores (decrementing)!
    if (event.type === 'goal' || event.type === 'own_goal') {
      const isTeamA = event.team_id === event.match.team_a_id;
      const isTeamB = event.team_id === event.match.team_b_id;
      
      let updateData: any = {};
      if (event.period === 'regular') {
        if (event.type === 'goal') {
          if (isTeamA) updateData.score_a = { decrement: 1 };
          else if (isTeamB) updateData.score_b = { decrement: 1 };
        } else if (event.type === 'own_goal') {
          if (isTeamA) updateData.score_b = { decrement: 1 };
          else if (isTeamB) updateData.score_a = { decrement: 1 };
        }
      } else if (event.period === 'extra_time') {
        if (event.type === 'goal') {
          if (isTeamA) updateData.score_a_extra = { decrement: 1 };
          else if (isTeamB) updateData.score_b_extra = { decrement: 1 };
        } else if (event.type === 'own_goal') {
          if (isTeamA) updateData.score_b_extra = { decrement: 1 };
          else if (isTeamB) updateData.score_a_extra = { decrement: 1 };
        }
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.match.update({
          where: { id: event.match_id },
          data: updateData,
        });
      }
    }

    await this.scoringService.recalculateMatch(event.match_id);
    await this.rankingsService.recalculate(event.match.phase.tournament_id, event.match.phase.id);

    return { success: true };
  }
}
