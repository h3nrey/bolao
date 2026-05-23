import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBracketSlotDto } from './dto/bracket.dto';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class BracketService {
  constructor(
    private prisma: PrismaService,
    private matchesService: MatchesService,
  ) {}

  async getBracket(phaseId: string) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    const slots = await this.prisma.bracketSlot.findMany({
      where: { phase_id: phaseId },
      include: {
        match: {
          include: {
            team_a: true,
            team_b: true,
          },
        },
      },
      orderBy: [
        { stage: 'asc' },
        { slot_number: 'asc' },
      ],
    });

    // Attach score to each slot's match
    const slotsWithScores = await Promise.all(
      slots.map(async (slot) => {
        if (slot.match) {
          const score = await this.matchesService.getScore(slot.match.id);
          return {
            ...slot,
            match: {
              ...slot.match,
              score,
            },
          };
        }
        return slot;
      }),
    );

    return slotsWithScores;
  }

  async createSlot(phaseId: string, dto: CreateBracketSlotDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    return this.prisma.bracketSlot.create({
      data: {
        phase_id: phaseId,
        stage: dto.stage,
        slot_number: dto.slot_number,
        source_a_type: dto.source_a_type,
        source_a_ref: dto.source_a_ref,
        source_b_type: dto.source_b_type,
        source_b_ref: dto.source_b_ref,
        match_id: dto.match_id,
      },
    });
  }

  async resolve(phaseId: string) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    // Load all GroupTeams with final_position set for this tournament
    const groupTeams = await this.prisma.groupTeam.findMany({
      where: {
        final_position: { not: null },
        group: {
          phase: {
            tournament_id: phase.tournament_id,
          },
        },
      },
      include: {
        group: true,
        team: true,
      },
    });

    // Find BracketSlots with source_type = 'group_position'
    const slots = await this.prisma.bracketSlot.findMany({
      where: {
        phase_id: phaseId,
      },
      include: {
        match: true,
      },
    });

    for (const slot of slots) {
      let teamAId: string | null = null;
      let teamBId: string | null = null;

      // Resolve source A
      if (slot.source_a_type === 'group_position') {
        teamAId = this.resolveGroupPosition(slot.source_a_ref, groupTeams);
      }

      // Resolve source B
      if (slot.source_b_type === 'group_position') {
        teamBId = this.resolveGroupPosition(slot.source_b_ref, groupTeams);
      }

      // Update the match with resolved teams
      if (slot.match_id && (teamAId || teamBId)) {
        const updateData: any = {};
        if (teamAId) updateData.team_a_id = teamAId;
        if (teamBId) updateData.team_b_id = teamBId;

        await this.prisma.match.update({
          where: { id: slot.match_id },
          data: updateData,
        });
      }
    }

    return { success: true, message: 'Bracket resolved from group positions' };
  }

  private resolveGroupPosition(
    ref: string,
    groupTeams: any[],
  ): string | null {
    // ref format: "A1" = group A, position 1
    const groupName = ref.charAt(0);
    const position = parseInt(ref.substring(1), 10);

    const match = groupTeams.find(
      (gt) => gt.group.name === groupName && gt.final_position === position,
    );

    return match ? match.team_id : null;
  }
}
