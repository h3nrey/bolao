import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, AddTeamDto, SetFinalPositionDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        phase: true,
        group_teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const standings = await this.getStandings(id);

    return {
      ...group,
      standings,
    };
  }

  async create(phaseId: string, dto: CreateGroupDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    return this.prisma.group.create({
      data: {
        name: dto.name,
        phase_id: phaseId,
      },
    });
  }

  async addTeam(groupId: string, dto: AddTeamDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const team = await this.prisma.team.findUnique({ where: { id: dto.team_id } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if team is already in the group
    const existing = await this.prisma.groupTeam.findUnique({
      where: {
        group_id_team_id: {
          group_id: groupId,
          team_id: dto.team_id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Team already in this group');
    }

    return this.prisma.groupTeam.create({
      data: {
        group_id: groupId,
        team_id: dto.team_id,
      },
    });
  }

  async setFinalPosition(groupId: string, teamId: string, dto: SetFinalPositionDto) {
    const groupTeam = await this.prisma.groupTeam.findUnique({
      where: {
        group_id_team_id: {
          group_id: groupId,
          team_id: teamId,
        },
      },
    });

    if (!groupTeam) {
      throw new NotFoundException('Team not found in this group');
    }

    return this.prisma.groupTeam.update({
      where: {
        id: groupTeam.id,
      },
      data: {
        final_position: dto.final_position,
      },
    });
  }

  async getStandings(groupId: string) {
    const groupTeams = await this.prisma.groupTeam.findMany({
      where: { group_id: groupId },
      include: { team: true },
    });

    const standings = groupTeams.map((gt) => ({
      team: gt.team,
      final_position: gt.final_position,
      P: 0,  // Points
      J: 0,  // Played
      V: 0,  // Wins
      E: 0,  // Draws
      D: 0,  // Losses
      GP: 0, // Goals For
      GC: 0, // Goals Against
      SG: 0, // Goal Difference
    }));

    const matches = await this.prisma.match.findMany({
      where: {
        group_id: groupId,
        status: 'finished',
      },
    });

    for (const match of matches) {
      if (!match.team_a_id || !match.team_b_id) continue;

      const events = await this.prisma.matchEvent.findMany({
        where: {
          match_id: match.id,
          type: { in: ['goal', 'own_goal'] },
        },
      });

      let score_a = 0;
      let score_b = 0;

      for (const event of events) {
        if (event.type === 'goal') {
          if (event.team_id === match.team_a_id) score_a++;
          else if (event.team_id === match.team_b_id) score_b++;
        } else if (event.type === 'own_goal') {
          if (event.team_id === match.team_a_id) score_b++;
          else if (event.team_id === match.team_b_id) score_a++;
        }
      }

      const teamA = standings.find((s) => s.team.id === match.team_a_id);
      const teamB = standings.find((s) => s.team.id === match.team_b_id);

      if (teamA && teamB) {
        teamA.J++;
        teamB.J++;
        teamA.GP += score_a;
        teamA.GC += score_b;
        teamB.GP += score_b;
        teamB.GC += score_a;

        if (score_a > score_b) {
          teamA.V++;
          teamA.P += 3;
          teamB.D++;
        } else if (score_b > score_a) {
          teamB.V++;
          teamB.P += 3;
          teamA.D++;
        } else {
          teamA.E++;
          teamA.P += 1;
          teamB.E++;
          teamB.P += 1;
        }
      }
    }

    // Calculate goal difference
    for (const entry of standings) {
      entry.SG = entry.GP - entry.GC;
    }

    // Sort: points -> goal diff -> goals for
    standings.sort((a, b) => {
      if (b.P !== a.P) return b.P - a.P;
      if (b.SG !== a.SG) return b.SG - a.SG;
      return b.GP - a.GP;
    });

    return standings;
  }
}
