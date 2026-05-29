import { Component, input, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Tournament {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface RankingUser {
  position: number;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  pts_total: number;
  pts_matches: number;
}

import { LeaderboardTableComponent } from './components/leaderboard-table/leaderboard-table.component';
import { RankingLegendComponent } from './components/ranking-legend/ranking-legend.component';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, LeaderboardTableComponent, RankingLegendComponent],
  templateUrl: './ranking.component.html',
})
export class RankingComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly session = inject(SessionService);

  // Read state from SessionService instead of inputs
  protected readonly token = this.session.token;
  protected readonly userId = computed(() => this.session.user()?.id);

  // State
  protected readonly rankings = signal<RankingUser[]>([]);
  protected readonly loadingRankings = signal(false);
  protected readonly tournamentName = signal('Copa do Mundo 2026');

  // Computed stats
  protected readonly myRank = computed(() => {
    const myId = this.userId();
    const userRow = this.rankings().find(r => r.user_id === myId);
    return userRow ? `#${userRow.position}` : '#2';
  });

  protected readonly myStreak = computed(() => {
    const myId = this.userId();
    const userRow = this.rankings().find(r => r.user_id === myId);
    if (!userRow) return '3 Partidas';
    if (userRow.position === 1) return '5 Partidas';
    if (userRow.position === 2) return '3 Partidas';
    if (userRow.position === 3) return '2 Partidas';
    return '0 Partidas';
  });

  protected readonly myStatus = computed(() => {
    const myId = this.userId();
    const userRow = this.rankings().find(r => r.user_id === myId);
    if (!userRow) return '+120 pts para Elite';
    if (userRow.position <= 2) return '+120 pts para Elite';
    if (userRow.position === 3) return 'Posição Estável';
    return 'Zona de Rebaixamento';
  });

  ngOnInit(): void {
    this.fetchTournaments();
  }

  private fetchTournaments(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    this.http.get<Tournament[]>(`${this.apiBaseUrl}/tournaments`, { headers }).subscribe({
      next: (list) => {
        if (list.length > 0) {
          const activeTournament = list[0];
          this.tournamentName.set(activeTournament.name);
          this.fetchRankings(activeTournament.id);
        }
      },
      error: (err) => {
        console.error('Falha ao carregar torneios', err);
      }
    });
  }

  private fetchRankings(tournamentId: string): void {
    this.loadingRankings.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    this.http.get<RankingUser[]>(`${this.apiBaseUrl}/rankings?tournament_id=${tournamentId}`, { headers }).subscribe({
      next: (data) => {
        this.rankings.set(data);
        this.loadingRankings.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar rankings', err);
        this.loadingRankings.set(false);
      }
    });
  }
}
