import { Component, input, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

interface MatchTeam {
  id: string;
  name: string;
  flag_emoji?: string | null;
}

interface Match {
  id: string;
  stage: string;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  team_a?: MatchTeam | null;
  team_b?: MatchTeam | null;
  score?: { score_a: number; score_b: number } | null;
}

interface LocalPrediction {
  scoreA: number;
  scoreB: number;
  isSaved: boolean;
  isModified: boolean;
  isSaving: boolean;
  error?: string | null;
}

@Component({
  selector: 'app-cartela',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cartela.component.html',
})
export class CartelaComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';

  token = input.required<string>();

  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(false);
  
  // Track inputs and saved/modified states dynamically
  protected readonly localPredictions = signal<{ [matchId: string]: LocalPrediction }>({});

  ngOnInit(): void {
    this.fetchData();
  }

  protected fetchData(): void {
    this.loading.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);

    forkJoin({
      matchesList: this.http.get<Match[]>(`${this.apiBaseUrl}/matches`, { headers }),
      myPredictions: this.http.get<any[]>(`${this.apiBaseUrl}/predictions/me`, { headers }),
    }).subscribe({
      next: ({ matchesList, myPredictions }) => {
        // Sort matches chronologically
        const sorted = matchesList.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        this.matches.set(sorted);

        const dict: { [matchId: string]: LocalPrediction } = {};
        for (const match of sorted) {
          const pred = myPredictions.find(p => p.match_id === match.id);
          if (pred) {
            const itemA = pred.items?.find((i: any) => i.type === 'score_a');
            const itemB = pred.items?.find((i: any) => i.type === 'score_b');
            dict[match.id] = {
              scoreA: itemA ? itemA.value_int : 0,
              scoreB: itemB ? itemB.value_int : 0,
              isSaved: true,
              isModified: false,
              isSaving: false
            };
          } else {
            dict[match.id] = {
              scoreA: 0,
              scoreB: 0,
              isSaved: false,
              isModified: false,
              isSaving: false
            };
          }
        }
        this.localPredictions.set(dict);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar dados da cartela', err);
        this.loading.set(false);
      }
    });
  }

  protected onInputChange(matchId: string): void {
    const dict = { ...this.localPredictions() };
    if (dict[matchId]) {
      dict[matchId].isModified = true;
      dict[matchId].isSaved = false;
      dict[matchId].error = null;
      this.localPredictions.set(dict);
    }
  }

  protected savePrediction(matchId: string): void {
    const dict = { ...this.localPredictions() };
    const pred = dict[matchId];
    if (!pred || pred.isSaving) return;

    pred.isSaving = true;
    pred.error = null;
    this.localPredictions.set(dict);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    const payload = {
      items: [
        { type: 'score_a', value_int: pred.scoreA },
        { type: 'score_b', value_int: pred.scoreB }
      ]
    };

    this.http.post<any>(`${this.apiBaseUrl}/matches/${matchId}/predictions`, payload, { headers }).subscribe({
      next: () => {
        const updatedDict = { ...this.localPredictions() };
        if (updatedDict[matchId]) {
          updatedDict[matchId].isSaving = false;
          updatedDict[matchId].isSaved = true;
          updatedDict[matchId].isModified = false;
        }
        this.localPredictions.set(updatedDict);
      },
      error: (err) => {
        console.error('Falha ao salvar palpite', err);
        const updatedDict = { ...this.localPredictions() };
        if (updatedDict[matchId]) {
          updatedDict[matchId].isSaving = false;
          updatedDict[matchId].error = 'Erro';
        }
        this.localPredictions.set(updatedDict);
      }
    });
  }

  protected isPastDeadline(match: Match): boolean {
    if (match.started_at) return true;
    const deadline = new Date(new Date(match.scheduled_at).getTime() - 5 * 60 * 1000);
    return new Date() > deadline;
  }
}
