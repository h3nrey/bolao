import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.team.findMany();
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { players: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async create(dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: dto,
    });
  }
}
