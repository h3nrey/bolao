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

  savePrediction(matchId: string, scoreA: number, scoreB: number): Observable<any> {
    const payload = {
      items: [
        { type: 'score_a', value_int: scoreA },
        { type: 'score_b', value_int: scoreB },
      ],
    };
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
}
