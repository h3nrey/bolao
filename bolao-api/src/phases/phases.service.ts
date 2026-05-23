import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhaseDto, UpdatePhaseStatusDto } from './dto/phase.dto';

@Injectable()
export class PhasesService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const phase = await this.prisma.phase.findUnique({
      where: { id },
      include: {
        groups: true,
        matches: {
          include: {
            team_a: true,
            team_b: true,
          },
        },
      },
    });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }
    return phase;
  }

  async create(tournamentId: string, dto: CreatePhaseDto) {
    // Verify tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return this.prisma.phase.create({
      data: {
        ...dto,
        tournament_id: tournamentId,
      },
    });
  }

  async updateStatus(id: string, dto: UpdatePhaseStatusDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    return this.prisma.phase.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });
  }
}
