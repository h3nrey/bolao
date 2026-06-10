import { Module, forwardRef } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { SpecialPredictionsController } from './special-predictions.controller';
import { SpecialPredictionsService } from './special-predictions.service';
import { ScoringService } from './scoring.service';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [forwardRef(() => MatchesModule)],
  controllers: [PredictionsController, SpecialPredictionsController],
  providers: [PredictionsService, SpecialPredictionsService, ScoringService],
  exports: [PredictionsService, SpecialPredictionsService, ScoringService],
})
export class PredictionsModule {}
