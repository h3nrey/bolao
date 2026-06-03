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

  getMatches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/matches`);
  }

  getMatch(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/matches/${id}`);
  }

  getMyPrediction(matchId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/matches/${matchId}/predictions/me`);
  }

  getOtherPredictions(matchId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/matches/${matchId}/predictions`);
  }

  savePrediction(matchId: string, scoreA: number, scoreB: number): Observable<any> {
    const payload = {
      items: [
        { type: 'score_a', value_int: scoreA },
        { type: 'score_b', value_int: scoreB },
      ],
    };
    return this.http.post<any>(`${this.apiUrl}/matches/${matchId}/predictions`, payload);
  }
}
