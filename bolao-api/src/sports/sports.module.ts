import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesModule } from '../matches/matches.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { RankingsModule } from '../rankings/rankings.module';
import { SportsService } from './sports.service';
import { SportsController } from './sports.controller';
import { ApiSportsAdapter } from './adapters/api-sports.adapter';
import { SportsProviderAdapter } from './interfaces/sports-provider.adapter';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MatchesModule),
    forwardRef(() => PredictionsModule),
    RankingsModule,
  ],
  controllers: [SportsController],
  providers: [
    SportsService,
    ApiSportsAdapter,
    {
      provide: SportsProviderAdapter,
      useClass: ApiSportsAdapter,
    },
  ],
  exports: [SportsService],
})
export class SportsModule {}
