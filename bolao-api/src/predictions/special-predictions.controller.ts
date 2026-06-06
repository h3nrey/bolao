import { Controller, Get, Post, Body, UseGuards, UsePipes, ForbiddenException } from '@nestjs/common';
import { SpecialPredictionsService } from './special-predictions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  submitSpecialPredictionSchema,
  SubmitSpecialPredictionDto,
  submitOfficialSpecialResultsSchema,
  SubmitOfficialSpecialResultsDto,
} from './dto/special-prediction.dto';

@Controller('predictions/special')
@UseGuards(JwtAuthGuard)
export class SpecialPredictionsController {
  constructor(private specialPredictionsService: SpecialPredictionsService) {}

  @Get('me')
  async getMySpecialPredictions(@CurrentUser() user: any) {
    return this.specialPredictionsService.getMySpecialPredictions(user.id);
  }

  @Post('me')
  @UsePipes(new ZodValidationPipe(submitSpecialPredictionSchema))
  async submitSpecialPredictions(
    @CurrentUser() user: any,
    @Body() dto: SubmitSpecialPredictionDto,
  ) {
    return this.specialPredictionsService.submitSpecialPredictions(user.id, dto);
  }

  @Get('official')
  async getOfficialResults() {
    return this.specialPredictionsService.getOfficialResults();
  }

  @Post('official')
  @UsePipes(new ZodValidationPipe(submitOfficialSpecialResultsSchema))
  async submitOfficialResults(
    @CurrentUser() user: any,
    @Body() dto: SubmitOfficialSpecialResultsDto,
  ) {
    if (!user.is_admin) {
      throw new ForbiddenException('Only admins can update official results.');
    }
    return this.specialPredictionsService.submitOfficialResults(dto);
  }
}
