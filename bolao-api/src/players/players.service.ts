import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async findAll(teamId?: string) {
    if (teamId) {
      return this.prisma.player.findMany({
        where: { team_id: teamId },
      });
    }
    return this.prisma.player.findMany();
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: { team: true },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  async create(dto: CreatePlayerDto) {
    // Check team exists
    const team = await this.prisma.team.findUnique({ where: { id: dto.team_id } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.player.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdatePlayerDto) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return this.prisma.player.update({
      where: { id },
      data: dto,
    });
  }
}
