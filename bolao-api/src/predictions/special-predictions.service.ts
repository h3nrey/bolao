import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitSpecialPredictionDto,
  SubmitOfficialSpecialResultsDto,
} from './dto/special-prediction.dto';

@Injectable()
export class SpecialPredictionsService {
  constructor(private prisma: PrismaService) {}

  async getMySpecialPredictions(userId: string) {
    const tournament = await this.prisma.tournament.findFirst();
    const isLocked = tournament ? !tournament.special_predictions_active : true;

    const prediction = await this.prisma.specialPrediction.findUnique({
      where: { user_id: userId },
      include: {
        champion_team: true,
        runner_up_team: true,
        third_place_team: true,
        top_scorer_player: { include: { team: true } },
        best_player_player: { include: { team: true } },
        surprise_team: true,
      },
    });

    if (!prediction) {
      return {
        champion_team_id: null,
        runner_up_team_id: null,
        third_place_team_id: null,
        top_scorer_player_id: null,
        best_player_player_id: null,
        surprise_team_id: null,
        is_locked: isLocked,
      };
    }

    return {
      ...prediction,
      is_locked: isLocked,
    };
  }

  async submitSpecialPredictions(
    userId: string,
    dto: SubmitSpecialPredictionDto,
  ) {
    const tournament = await this.prisma.tournament.findFirst();
    if (!tournament || !tournament.special_predictions_active) {
      throw new ForbiddenException(
        'Special predictions are closed.',
      );
    }

    return this.prisma.specialPrediction.upsert({
      where: { user_id: userId },
      update: {
        champion_team_id: dto.champion_team_id || null,
        runner_up_team_id: dto.runner_up_team_id || null,
        third_place_team_id: dto.third_place_team_id || null,
        top_scorer_player_id: dto.top_scorer_player_id || null,
        best_player_player_id: dto.best_player_player_id || null,
        surprise_team_id: dto.surprise_team_id || null,
      },
      create: {
        user_id: userId,
        champion_team_id: dto.champion_team_id || null,
        runner_up_team_id: dto.runner_up_team_id || null,
        third_place_team_id: dto.third_place_team_id || null,
        top_scorer_player_id: dto.top_scorer_player_id || null,
        best_player_player_id: dto.best_player_player_id || null,
        surprise_team_id: dto.surprise_team_id || null,
      },
    });
  }

  async getOfficialResults() {
    const tournament = await this.prisma.tournament.findFirst({
      include: {
        champion_team: true,
        runner_up_team: true,
        third_place_team: true,
        top_scorer_player: { include: { team: true } },
        best_player_player: { include: { team: true } },
        surprise_team: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return {
      champion_team_id: tournament.champion_team_id,
      runner_up_team_id: tournament.runner_up_team_id,
      third_place_team_id: tournament.third_place_team_id,
      top_scorer_player_id: tournament.top_scorer_player_id,
      best_player_player_id: tournament.best_player_player_id,
      surprise_team_id: tournament.surprise_team_id,
      champion_team: tournament.champion_team,
      runner_up_team: tournament.runner_up_team,
      third_place_team: tournament.third_place_team,
      top_scorer_player: tournament.top_scorer_player,
      best_player_player: tournament.best_player_player,
      surprise_team: tournament.surprise_team,
    };
  }

  async submitOfficialResults(dto: SubmitOfficialSpecialResultsDto) {
    const tournament = await this.prisma.tournament.findFirst();
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        champion_team_id: dto.champion_team_id || null,
        runner_up_team_id: dto.runner_up_team_id || null,
        third_place_team_id: dto.third_place_team_id || null,
        top_scorer_player_id: dto.top_scorer_player_id || null,
        best_player_player_id: dto.best_player_player_id || null,
        surprise_team_id: dto.surprise_team_id || null,
      },
    });

    return updated;
  }
}
