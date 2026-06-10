import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.constants';

@Injectable({
  providedIn: 'root',
})
export class SpecialPredictionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL;

  getTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teams`);
  }

  getPlayers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/players`);
  }

  getMySpecialPredictions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/predictions/special/me`);
  }

  saveSpecialPredictions(predictions: {
    champion_team_id: string | null;
    runner_up_team_id: string | null;
    third_place_team_id: string | null;
    top_scorer_player_id: string | null;
    best_player_player_id: string | null;
    surprise_team_id: string | null;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/predictions/special/me`, predictions);
  }
}
