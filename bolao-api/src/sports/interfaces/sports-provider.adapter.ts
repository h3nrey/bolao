export interface ExternalTeam {
  name: string;
  external_id: string;
  flag_url?: string | null;
}

export interface ExternalGoalEvent {
  minute: number;
  period: 'regular' | 'extra_time';
  team_external_id: string;
  player_name?: string;
  is_own_goal: boolean;
}

export interface ExternalFixture {
  external_id: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  scheduled_at: Date;
  started_at?: Date | null;
  ended_at?: Date | null;
  team_a: ExternalTeam;
  team_b: ExternalTeam;
  score_a: number;
  score_b: number;
  goals: ExternalGoalEvent[];
  current_minute?: number | null;
}

export abstract class SportsProviderAdapter {
  abstract fetchFixtures(leagueId: string, season: string): Promise<ExternalFixture[]>;
  abstract fetchLiveFixtures(leagueId: string): Promise<ExternalFixture[]>;
}
