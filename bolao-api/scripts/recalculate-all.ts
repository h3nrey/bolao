import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ScoringService } from '../src/predictions/scoring.service';
import { RankingsService } from '../src/rankings/rankings.service';
import * as fs from 'fs';
import * as path from 'path';

function parseDateTime(dateStr: string, timeStr: string): Date {
  const matches = timeStr.match(/^(\d{2}:\d{2})\s+UTC([+-]\d+)?$/);
  if (matches) {
    const time = matches[1];
    const offset = matches[2];
    if (!offset) {
      return new Date(`${dateStr}T${time}:00Z`);
    }
    const offsetNum = parseInt(offset, 10);
    const sign = offsetNum >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetNum);
    const offsetStr = `${sign}${String(absOffset).padStart(2, '0')}:00`;
    return new Date(`${dateStr}T${time}:00${offsetStr}`);
  }
  return new Date(`${dateStr}T00:00:00Z`);
}

async function main() {
  console.log('====================================================');
  console.log('EMERGENCY RANKINGS AND POINTS RECALCULATION SCRIPT');
  console.log('====================================================');
  
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const scoringService = app.get(ScoringService);
  const rankingsService = app.get(RankingsService);

  const rankingsOnly = process.argv.includes('--rankings-only');
  if (rankingsOnly) {
    console.log('\n[Rankings-Only Mode] Skipping match date corrections, auto-finishing, and points recalculation.');
  } else {
    console.log('\nStep 1: Correcting scheduled times in database and reverting empty finished matches...');
    const jsonPath = path.join(__dirname, '../matches.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const now = new Date();
    
    let correctedCount = 0;
    let revertedCount = 0;

    for (const jsonMatch of data.matches) {
      const teamA = await prisma.team.findFirst({ where: { name: jsonMatch.team1 } });
      const teamB = await prisma.team.findFirst({ where: { name: jsonMatch.team2 } });

      if (teamA && teamB) {
        const correctUtcDate = parseDateTime(jsonMatch.date, jsonMatch.time);

        const dbMatch = await prisma.match.findFirst({
          where: {
            team_a_id: teamA.id,
            team_b_id: teamB.id,
          },
        });

        if (dbMatch) {
          // Update the scheduled_at to the correct UTC timestamp in database
          if (dbMatch.scheduled_at.getTime() !== correctUtcDate.getTime()) {
            await prisma.match.update({
              where: { id: dbMatch.id },
              data: {
                scheduled_at: correctUtcDate,
              },
            });
            correctedCount++;
          }

          // If the match was marked as finished but has no scores and no events, it was incorrectly closed. Revert it.
          const eventCount = await prisma.matchEvent.count({ where: { match_id: dbMatch.id } });
          if (
            dbMatch.status === 'finished' &&
            dbMatch.score_a === 0 &&
            dbMatch.score_b === 0 &&
            dbMatch.score_a_extra === 0 &&
            dbMatch.score_b_extra === 0 &&
            dbMatch.penalty_score_a === null &&
            dbMatch.penalty_score_b === null &&
            eventCount === 0
          ) {
            await prisma.match.update({
              where: { id: dbMatch.id },
              data: {
                status: 'upcoming',
                ended_at: null,
              },
            });
            revertedCount++;
            console.log(`Reverted Match ID ${dbMatch.id} (${jsonMatch.team1} x ${jsonMatch.team2}) back to 'upcoming' (no scores/events)`);
          }
        }
      }
    }
    console.log(`Corrected scheduled times for ${correctedCount} matches in database.`);
    console.log(`Reverted ${revertedCount} matches back to 'upcoming'.`);

    console.log('\nStep 2: Finding and auto-finishing matches with scores set...');
    
    // Find matches with status 'upcoming' or 'live' that have:
    // - a non-zero score (score_a > 0, score_b > 0, score_a_extra > 0, score_b_extra > 0)
    // - or have non-null penalty scores
    // We do NOT finish matches based purely on time if they have no scores set yet.
    const matchesToFinish = await prisma.match.findMany({
      where: {
        status: { in: ['upcoming', 'live'] },
        OR: [
          { score_a: { gt: 0 } },
          { score_b: { gt: 0 } },
          { score_a_extra: { gt: 0 } },
          { score_b_extra: { gt: 0 } },
          { penalty_score_a: { not: null } },
          { penalty_score_b: { not: null } },
        ],
      },
    });

    if (matchesToFinish.length > 0) {
      console.log(`Found ${matchesToFinish.length} matches to auto-finish:`);
      for (const match of matchesToFinish) {
        console.log(`Updating Match ID ${match.id} (Scheduled: ${match.scheduled_at.toISOString()}, Score: ${match.score_a}-${match.score_b}) to status 'finished'...`);
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: 'finished',
            ended_at: now,
          },
        });
      }
      console.log(`Successfully auto-finished ${matchesToFinish.length} matches.`);
    } else {
      console.log('No matches need to be auto-finished.');
    }

    console.log('\nStep 3: Fetching all finished matches...');
    const finishedMatches = await prisma.match.findMany({
      where: { status: 'finished' },
    });
    console.log(`Found ${finishedMatches.length} finished matches.`);

    console.log('\nStep 4: Recalculating prediction points for finished matches...');
    for (const match of finishedMatches) {
      console.log(`Recalculating points for Match ID: ${match.id} (Score: ${match.score_a} - ${match.score_b})`);
      await scoringService.recalculateMatch(match.id);
    }
  }

  console.log('\nStep 5: Fetching all tournaments...');
  const tournaments = await prisma.tournament.findMany({
    include: {
      phases: true,
    },
  });
  console.log(`Found ${tournaments.length} tournaments.`);

  console.log('\nStep 6: Recalculating rankings for all tournaments and phases...');
  for (const tournament of tournaments) {
    console.log(`\nProcessing Tournament: "${tournament.name}" (${tournament.id})`);
    
    // Recalculate phases
    for (const phase of tournament.phases) {
      console.log(`  -> Recalculating Phase: "${phase.name}" (${phase.id})`);
      await rankingsService.recalculate(tournament.id, phase.id);
    }
    
    // Recalculate overall (overall rankings)
    console.log(`  -> Recalculating Overall Rankings`);
    await rankingsService.recalculate(tournament.id, null);
  }

  console.log('\n====================================================');
  console.log('SUCCESS: All points and rankings recalculated!');
  console.log('====================================================');
  
  await app.close();
}

main().catch((err) => {
  console.error('\nFATAL ERROR during recalculation:', err);
  process.exit(1);
});
