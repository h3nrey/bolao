import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

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

  async update(id: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return this.prisma.team.update({
      where: { id },
      data: dto,
    });
  }

  async removeBulk(ids: string[]) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Nullify references to these teams in Tournaments
      await tx.tournament.updateMany({
        where: { champion_team_id: { in: ids } },
        data: { champion_team_id: null },
      });
      await tx.tournament.updateMany({
        where: { runner_up_team_id: { in: ids } },
        data: { runner_up_team_id: null },
      });
      await tx.tournament.updateMany({
        where: { third_place_team_id: { in: ids } },
        data: { third_place_team_id: null },
      });
      await tx.tournament.updateMany({
        where: { surprise_team_id: { in: ids } },
        data: { surprise_team_id: null },
      });

      // 2. Nullify references to these teams' players in Tournaments
      const players = await tx.player.findMany({
        where: { team_id: { in: ids } },
        select: { id: true },
      });
      const playerIds = players.map((p) => p.id);

      if (playerIds.length > 0) {
        await tx.tournament.updateMany({
          where: { top_scorer_player_id: { in: playerIds } },
          data: { top_scorer_player_id: null },
        });
        await tx.tournament.updateMany({
          where: { best_player_player_id: { in: playerIds } },
          data: { best_player_player_id: null },
        });
      }

      // 3. Nullify references to these teams/players in SpecialPrediction
      await tx.specialPrediction.updateMany({
        where: { champion_team_id: { in: ids } },
        data: { champion_team_id: null },
      });
      await tx.specialPrediction.updateMany({
        where: { runner_up_team_id: { in: ids } },
        data: { runner_up_team_id: null },
      });
      await tx.specialPrediction.updateMany({
        where: { third_place_team_id: { in: ids } },
        data: { third_place_team_id: null },
      });
      await tx.specialPrediction.updateMany({
        where: { surprise_team_id: { in: ids } },
        data: { surprise_team_id: null },
      });

      if (playerIds.length > 0) {
        await tx.specialPrediction.updateMany({
          where: { top_scorer_player_id: { in: playerIds } },
          data: { top_scorer_player_id: null },
        });
        await tx.specialPrediction.updateMany({
          where: { best_player_player_id: { in: playerIds } },
          data: { best_player_player_id: null },
        });
      }

      // 4. Retrieve all matches involving these teams
      const matches = await tx.match.findMany({
        where: {
          OR: [
            { team_a_id: { in: ids } },
            { team_b_id: { in: ids } },
          ],
        },
        select: { id: true },
      });
      const matchIds = matches.map((m) => m.id);

      if (matchIds.length > 0) {
        // Delete BracketSlots referencing these matches
        await tx.bracketSlot.deleteMany({
          where: { match_id: { in: matchIds } },
        });

        // Delete PredictionPoints and items linked to Predictions of these matches
        const predictions = await tx.prediction.findMany({
          where: { match_id: { in: matchIds } },
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

        // Delete MatchExtraPeriods and MatchEvents for these matches
        await tx.matchExtraPeriod.deleteMany({
          where: { match_id: { in: matchIds } },
        });
        await tx.matchEvent.deleteMany({
          where: { match_id: { in: matchIds } },
        });

        // Delete the Match records
        await tx.match.deleteMany({
          where: { id: { in: matchIds } },
        });
      }

      // Delete stray PredictionItems that reference these teams/players directly
      await tx.predictionItem.deleteMany({
        where: {
          OR: [
            { value_team_id: { in: ids } },
            ...(playerIds.length > 0 ? [{ value_player_id: { in: playerIds } }] : []),
          ],
        },
      });

      // 5. Delete remaining events/relations for players of these teams
      if (playerIds.length > 0) {
        await tx.matchEvent.deleteMany({
          where: { player_id: { in: playerIds } },
        });
        await tx.player.deleteMany({
          where: { id: { in: playerIds } },
        });
      }

      // 6. Delete GroupTeam relations
      await tx.groupTeam.deleteMany({
        where: { team_id: { in: ids } },
      });

      // 7. Delete the Teams themselves
      const deleted = await tx.team.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    });
  }
}

