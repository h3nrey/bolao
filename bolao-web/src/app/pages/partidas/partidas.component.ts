import { Component, input, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface MatchTeam {
  id: string;
  name: string;
  flag_emoji?: string | null;
  flag_url?: string | null;
}

interface MatchScore {
  score_a: number;
  score_b: number;
  score_a_regular: number;
  score_b_regular: number;
  score_a_extra: number;
  score_b_extra: number;
}

interface Match {
  id: string;
  phase_id: string;
  group_id?: string | null;
  stage: string;
  team_a_id?: string | null;
  team_b_id?: string | null;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  team_a?: MatchTeam | null;
  team_b?: MatchTeam | null;
  score?: MatchScore | null;
  current_minute?: number | null;
}

@Component({
  selector: 'app-partidas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partidas.component.html',
})
export class PartidasComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';

  // Inputs
  token = input.required<string>();

  // State
  protected readonly matches = signal<Match[]>([]);
  protected readonly loadingMatches = signal(false);

  // Grouped matches by date label
  protected readonly groupedMatches = computed(() => {
    const rawMatches = this.matches();
    if (rawMatches.length === 0) return [];

    const groups: { [key: string]: Match[] } = {};

    rawMatches.forEach(match => {
      const date = new Date(match.scheduled_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(match);
    });

    const sortedKeys = Object.keys(groups).sort();
    
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const weekDays = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    return sortedKeys.map(key => {
      const matchesInGroup = groups[key];
      const dateObj = new Date(matchesInGroup[0].scheduled_at);
      
      let dateLabel = '';
      if (key === todayKey) {
        dateLabel = `Hoje, ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
      } else if (key === tomorrowKey) {
        dateLabel = `Amanhã, ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
      } else {
        const dayOfWeek = weekDays[dateObj.getDay()];
        dateLabel = `${dayOfWeek}, ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
      }

      return {
        dateLabel,
        matches: matchesInGroup
      };
    });
  });

  ngOnInit(): void {
    this.fetchMatches();
  }

  private fetchMatches(): void {
    this.loadingMatches.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    this.http.get<Match[]>(`${this.apiBaseUrl}/matches`, { headers }).subscribe({
      next: (list) => {
        // Sort matches: live first, then upcoming (closest first), then finished (most recent first)
        const sorted = list.sort((a, b) => {
          const statusOrder = { 'live': 0, 'upcoming': 1, 'finished': 2, 'cancelled': 3 };
          const orderA = statusOrder[a.status] ?? 4;
          const orderB = statusOrder[b.status] ?? 4;
          
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          
          const dateA = new Date(a.scheduled_at).getTime();
          const dateB = new Date(b.scheduled_at).getTime();
          
          if (a.status === 'finished') {
            return dateB - dateA;
          }
          return dateA - dateB;
        });
        this.matches.set(sorted);
        this.loadingMatches.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar partidas', err);
        this.loadingMatches.set(false);
      }
    });
  }
}
