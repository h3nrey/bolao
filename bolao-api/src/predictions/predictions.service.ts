import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePredictionDto } from './dto/prediction.dto';
import {
  encryptPredictionItem,
  hydratePredictionItems,
  PredictionItemPayload,
} from './prediction-item.crypto';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async getMyAllPredictions(userId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: { user_id: userId },
      include: {
        items: true,
      },
    });

    return predictions.map((prediction) => ({
      ...prediction,
      items: hydratePredictionItems(prediction.items as any),
    }));
  }

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

    return {
      ...prediction,
      items: hydratePredictionItems(prediction.items as any),
    };
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

    const predictions = await this.prisma.prediction.findMany({
      where: { match_id: matchId },
      include: {
        user: true,
        items: true,
        points: true,
      },
    });

    return predictions.map((prediction) => ({
      ...prediction,
      items: hydratePredictionItems(prediction.items as any),
    }));
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
          encrypted_value: encryptPredictionItem(item as PredictionItemPayload),
          value_int: null,
          value_team_id: null,
          value_player_id: null,
        })) as any,
      });

      const updated = await this.prisma.prediction.findUnique({
        where: { id: existing.id },
        include: { items: true },
      });

      return updated
        ? {
            ...updated,
            items: hydratePredictionItems(updated.items as any),
          }
        : updated;
    }

    // Create new prediction with items
    const created = await this.prisma.prediction.create({
      data: {
        user_id: userId,
        match_id: matchId,
        items: {
          create: dto.items.map((item) => ({
            type: item.type as any,
            encrypted_value: encryptPredictionItem(item as PredictionItemPayload),
            value_int: null,
            value_team_id: null,
            value_player_id: null,
          })) as any,
        },
      },
      include: { items: true },
    });

    return {
      ...created,
      items: hydratePredictionItems(created.items as any),
    };
  }
}
