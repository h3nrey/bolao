import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { PhasesModule } from './phases/phases.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { GroupsModule } from './groups/groups.module';
import { MatchesModule } from './matches/matches.module';
import { MatchEventsModule } from './match-events/match-events.module';
import { PredictionsModule } from './predictions/predictions.module';
import { RankingsModule } from './rankings/rankings.module';
import { BracketModule } from './bracket/bracket.module';
import { SportsModule } from './sports/sports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const requiredEnvVars = [
          'DATABASE_URL',
          'JWT_SECRET',
          'GOOGLE_CLIENT_ID',
          'GOOGLE_CLIENT_SECRET',
          'GOOGLE_CALLBACK_URL',
          'FRONTEND_URL',
        ];
        const missingEnvVars = requiredEnvVars.filter((key) => !config[key]);

        if (missingEnvVars.length > 0) {
          throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
        }

        return config;
      },
      load: [() => ({
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
      })],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TournamentsModule,
    PhasesModule,
    TeamsModule,
    PlayersModule,
    GroupsModule,
    MatchesModule,
    MatchEventsModule,
    PredictionsModule,
    RankingsModule,
    BracketModule,
    SportsModule,
  ],
})
export class AppModule {}
