import { Module } from '@nestjs/common';
import { BracketService } from './bracket.service';
import { BracketController } from './bracket.controller';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [MatchesModule],
  controllers: [BracketController],
  providers: [BracketService],
  exports: [BracketService],
})
export class BracketModule {}
