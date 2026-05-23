import { Module, forwardRef } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { ScoringService } from './scoring.service';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [
    forwardRef(() => MatchesModule),
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService, ScoringService],
  exports: [PredictionsService, ScoringService],
})
export class PredictionsModule {}
