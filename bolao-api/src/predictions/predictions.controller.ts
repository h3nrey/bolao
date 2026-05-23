import { Controller, Get, Post, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createPredictionSchema, CreatePredictionDto } from './dto/prediction.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get('matches/:matchId/predictions/me')
  async getMyPrediction(
    @Param('matchId') matchId: string,
    @CurrentUser() user: any,
  ) {
    return this.predictionsService.getMyPrediction(matchId, user.id);
  }

  @Get('matches/:matchId/predictions')
  async getAllForMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.getAllForMatch(matchId);
  }

  @Post('matches/:matchId/predictions')
  @UsePipes(new ZodValidationPipe(createPredictionSchema))
  async create(
    @Param('matchId') matchId: string,
    @CurrentUser() user: any,
    @Body() dto: CreatePredictionDto,
  ) {
    return this.predictionsService.createOrUpdate(matchId, user.id, dto);
  }
}
