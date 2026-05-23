import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePredictionDto } from './dto/prediction.dto';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async getMyPrediction(matchId: string, userId: string) {
    const prediction = await this.prisma.prediction.findUnique({
      where: {
        user_id_match_id: {
          user_id: userId,
          match_id: matchId,
        },
      },
      include: {
        items: true,
        points: true,
      },
    });

    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }

    return prediction;
  }

  async getAllForMatch(matchId: string) {
    // Only visible after match has started
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (!match.started_at) {
      throw new ForbiddenException('Predictions are only visible after the match starts');
    }

    return this.prisma.prediction.findMany({
      where: { match_id: matchId },
      include: {
        user: true,
        items: true,
        points: true,
      },
    });
  }

  async createOrUpdate(matchId: string, userId: string, dto: CreatePredictionDto) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Check deadline: scheduled_at - 5 minutes > now()
    const deadline = new Date(match.scheduled_at.getTime() - 5 * 60 * 1000);
    if (new Date() > deadline) {
      throw new ForbiddenException('Prediction deadline has passed');
    }

    // Upsert prediction
    const existing = await this.prisma.prediction.findUnique({
      where: {
        user_id_match_id: {
          user_id: userId,
          match_id: matchId,
        },
      },
    });

    if (existing) {
      // Delete old items and replace
      await this.prisma.predictionItem.deleteMany({
        where: { prediction_id: existing.id },
      });

      await this.prisma.predictionItem.createMany({
        data: dto.items.map((item) => ({
          prediction_id: existing.id,
          type: item.type as any,
          value_int: 'value_int' in item ? item.value_int : null,
          value_team_id: 'value_team_id' in item ? item.value_team_id : null,
          value_player_id: 'value_player_id' in item ? item.value_player_id : null,
        })),
      });

      return this.prisma.prediction.findUnique({
        where: { id: existing.id },
        include: { items: true },
      });
    }

    // Create new prediction with items
    return this.prisma.prediction.create({
      data: {
        user_id: userId,
        match_id: matchId,
        items: {
          create: dto.items.map((item) => ({
            type: item.type as any,
            value_int: 'value_int' in item ? item.value_int : null,
            value_team_id: 'value_team_id' in item ? item.value_team_id : null,
            value_player_id: 'value_player_id' in item ? item.value_player_id : null,
          })),
        },
      },
      include: { items: true },
    });
  }
}
