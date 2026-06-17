import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.constants';

@Injectable({
  providedIn: 'root',
})
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL;

  getMatches(sort?: 'status' | 'chronological'): Observable<any[]> {
    const url = sort ? `${this.apiUrl}/matches?sort=${sort}` : `${this.apiUrl}/matches`;
    return this.http.get<any[]>(url);
  }

  getMatch(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/matches/${id}`);
  }

  getMyPrediction(matchId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/matches/${matchId}/predictions/me`);
  }

  getMyPredictions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/predictions/me`);
  }

  getOtherPredictions(matchId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/matches/${matchId}/predictions`);
  }

  savePrediction(
    matchId: string,
    scoreA: number,
    scoreB: number,
    multipliers?: {
      scorerPlayerId?: string | null;
      firstGoalTeamId?: string | null;
      cardsQuantity?: number | null;
      cornersQuantity?: number | null;
      bothTeamsScore?: number | null;
    }
  ): Observable<any> {
    const items: any[] = [
      { type: 'score_a', value_int: scoreA },
      { type: 'score_b', value_int: scoreB },
    ];

    if (multipliers) {
      if (multipliers.scorerPlayerId !== undefined) {
        items.push({
          type: 'scorer_player',
          value_player_id: multipliers.scorerPlayerId || null,
        });
      }
      if (multipliers.firstGoalTeamId !== undefined) {
        const teamId = (multipliers.firstGoalTeamId === 'none' || !multipliers.firstGoalTeamId)
          ? null
          : multipliers.firstGoalTeamId;
        items.push({
          type: 'first_goal_team',
          value_team_id: teamId,
        });
      }
      if (multipliers.cardsQuantity !== undefined && multipliers.cardsQuantity !== null) {
        items.push({
          type: 'cards_quantity',
          value_int: multipliers.cardsQuantity,
        });
      }
      if (multipliers.cornersQuantity !== undefined && multipliers.cornersQuantity !== null) {
        items.push({
          type: 'corners_quantity',
          value_int: multipliers.cornersQuantity,
        });
      }
      if (multipliers.bothTeamsScore !== undefined && multipliers.bothTeamsScore !== null) {
        items.push({
          type: 'both_teams_score',
          value_int: multipliers.bothTeamsScore,
        });
      }
    }

    const payload = { items };
    return this.http.post<any>(`${this.apiUrl}/matches/${matchId}/predictions`, payload);
  }

  createMatch(phaseId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/phases/${phaseId}/matches`, payload);
  }

  updateMatch(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/matches/${id}`, payload);
  }

  deleteMatch(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/matches/${id}`);
  }

  getPhases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/phases`);
  }

  getMatchEvents(matchId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/matches/${matchId}/events`);
  }

  createMatchEvent(matchId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/matches/${matchId}/events`, payload);
  }

  deleteMatchEvent(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/match-events/${id}`);
  }
}
