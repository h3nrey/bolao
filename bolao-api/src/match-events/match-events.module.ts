import { Module, forwardRef } from '@nestjs/common';
import { MatchEventsService } from './match-events.service';
import { MatchEventsController } from './match-events.controller';
import { PredictionsModule } from '../predictions/predictions.module';
import { RankingsModule } from '../rankings/rankings.module';

@Module({
  imports: [
    forwardRef(() => PredictionsModule),
    RankingsModule,
  ],
  controllers: [MatchEventsController],
  providers: [MatchEventsService],
  exports: [MatchEventsService],
})
export class MatchEventsModule {}
