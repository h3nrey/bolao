import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  SportsProviderAdapter, 
  ExternalFixture, 
  ExternalGoalEvent, 
  ExternalTeam 
} from '../interfaces/sports-provider.adapter';

@Injectable()
export class ApiSportsAdapter implements SportsProviderAdapter {
  private readonly logger = new Logger(ApiSportsAdapter.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';

  constructor(private configService: ConfigService) {}

  private getHeaders(): HeadersInit {
    const apiKey = this.configService.get<string>('API_SPORTS_KEY');
    if (!apiKey) {
      this.logger.warn('API_SPORTS_KEY environment variable is not defined!');
    }
    return {
      'x-apisports-key': apiKey || '',
      'Content-Type': 'application/json',
    };
  }

  async fetchFixtures(leagueId: string, season: string): Promise<ExternalFixture[]> {
    try {
      this.logger.log(`Fetching fixtures for league ${leagueId}, season ${season}...`);
      const response = await fetch(`${this.baseUrl}/fixtures?league=${leagueId}&season=${season}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const body = await response.json();
      if (body.errors && Object.keys(body.errors).length > 0) {
        throw new Error(`API Sports Error: ${JSON.stringify(body.errors)}`);
      }

      const results = body.response || [];
      return results.map((f: any) => this.mapToExternalFixture(f));
    } catch (err: any) {
      this.logger.error(`Failed to fetch fixtures: ${err.message}`, err.stack);
      throw err;
    }
  }

  async fetchLiveFixtures(leagueId: string): Promise<ExternalFixture[]> {
    try {
      this.logger.log(`Fetching live fixtures for league ${leagueId}...`);
      const response = await fetch(`${this.baseUrl}/fixtures?league=${leagueId}&live=all`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const body = await response.json();
      if (body.errors && Object.keys(body.errors).length > 0) {
        throw new Error(`API Sports Error: ${JSON.stringify(body.errors)}`);
      }

      const results = body.response || [];
      return results.map((f: any) => this.mapToExternalFixture(f));
    } catch (err: any) {
      this.logger.error(`Failed to fetch live fixtures: ${err.message}`, err.stack);
      throw err;
    }
  }

  private mapToExternalFixture(f: any): ExternalFixture {
    const fixture = f.fixture;
    const teams = f.teams;
    const score = f.score;
    const goals = f.goals;
    const events = f.events || [];

    // Map status short code to core MatchStatus
    let status: 'upcoming' | 'live' | 'finished' | 'cancelled' = 'upcoming';
    const apiStatus = fixture.status.short;

    if (apiStatus === 'NS') {
      status = 'upcoming';
    } else if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(apiStatus)) {
      status = 'live';
    } else if (['FT', 'AET', 'PEN'].includes(apiStatus)) {
      status = 'finished';
    } else if (['PST', 'CANC', 'ABD', 'WO'].includes(apiStatus)) {
      status = 'cancelled';
    }

    // Map Teams
    const teamA: ExternalTeam = {
      name: teams.home.name,
      external_id: String(teams.home.id),
      flag_url: teams.home.logo,
    };

    const teamB: ExternalTeam = {
      name: teams.away.name,
      external_id: String(teams.away.id),
      flag_url: teams.away.logo,
    };

    // Filter and map goals events
    const goalEvents: ExternalGoalEvent[] = events
      .filter((e: any) => e.type === 'Goal')
      .map((e: any) => {
        const isOwnGoal = e.detail === 'Own Goal';
        const elapsed = e.time.elapsed || 0;
        
        // If elapsed is > 90, map as extra_time
        const period: 'regular' | 'extra_time' = elapsed <= 90 ? 'regular' : 'extra_time';

        return {
          minute: elapsed,
          period,
          team_external_id: String(e.team.id),
          player_name: e.player.name || undefined,
          is_own_goal: isOwnGoal,
        };
      });

    return {
      external_id: String(fixture.id),
      status,
      scheduled_at: new Date(fixture.date),
      started_at: fixture.periods.first ? new Date(fixture.periods.first * 1000) : null,
      ended_at: status === 'finished' ? new Date() : null,
      team_a: teamA,
      team_b: teamB,
      score_a: goals.home ?? 0,
      score_b: goals.away ?? 0,
      goals: goalEvents,
      current_minute: fixture.status.elapsed,
    };
  }
}
