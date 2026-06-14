import { Module, forwardRef } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PredictionsModule } from '../predictions/predictions.module';
import { RankingsModule } from '../rankings/rankings.module';
import { FootballDataSyncService } from './football-data-sync.service';

@Module({
  imports: [forwardRef(() => PredictionsModule), RankingsModule],
  controllers: [MatchesController],
  providers: [MatchesService, FootballDataSyncService],
  exports: [MatchesService, FootballDataSyncService],
})
export class MatchesModule {}
