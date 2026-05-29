import { Component, input, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TabSelectorComponent, TabOption } from '../../components/ui/tab-selector/tab-selector.component';
import { KnockoutBracketComponent } from '../../components/ui/knockout-bracket/knockout-bracket.component';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner/loading-spinner.component';
import { MatchCardData } from './components/match-card/match-card.component';
import { MatchDetailComponent } from './components/match-detail/match-detail.component';
import { MatchDayGroupComponent } from './components/match-day-group/match-day-group.component';
import { SessionService } from '../../services/session.service';
import { API_BASE_URL } from '../../config/api.constants';

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
  team_a?: { id: string; name: string; flag_emoji?: string | null } | null;
  team_b?: { id: string; name: string; flag_emoji?: string | null } | null;
  score?: { score_a: number; score_b: number } | null;
  current_minute?: number | null;
}

@Component({
  selector: 'app-partidas',
  standalone: true,
  imports: [
    CommonModule,
    TabSelectorComponent,
    KnockoutBracketComponent,
    LoadingSpinnerComponent,
    MatchDetailComponent,
    MatchDayGroupComponent,
  ],
  templateUrl: './partidas.component.html',
})
export class PartidasComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = API_BASE_URL;
  private readonly session = inject(SessionService);

  protected readonly token = this.session.token;

  // List state
  protected readonly matches = signal<Match[]>([]);
  protected readonly loadingMatches = signal(false);
  protected readonly activeStage = signal<'groups' | 'knockout'>('groups');

  // Navigation: which match is selected (shows detail view)
  protected readonly selectedMatchId = signal<string | null>(null);

  // Tab options
  protected readonly stageTabs: TabOption[] = [
    { id: 'groups', label: 'Fase de Grupos' },
    { id: 'knockout', label: 'Fase Eliminatória' },
  ];

  protected setActiveStage(id: string): void {
    if (id === 'groups' || id === 'knockout') this.activeStage.set(id);
  }

  // Matches grouped by date, filtered by active stage
  protected readonly groupedMatches = computed(() => {
    const rawMatches = this.matches();
    if (!rawMatches.length) return [];

    const currentStage = this.activeStage();
    const filtered = rawMatches.filter(m =>
      currentStage === 'groups' ? m.stage === 'groups' : m.stage !== 'groups'
    );

    if (!filtered.length) return [];

    const groups: Record<string, Match[]> = {};
    for (const match of filtered) {
      const d = new Date(match.scheduled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      (groups[key] ??= []).push(match);
    }

    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const weekDays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    return Object.keys(groups).sort().map(key => {
      const matchesInGroup = groups[key];
      const dateObj = new Date(matchesInGroup[0].scheduled_at);
      let dateLabel = '';
      if (key === todayKey) {
        dateLabel = `Hoje, ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
      } else if (key === tomorrowKey) {
        dateLabel = `Amanhã, ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
      } else {
        dateLabel = `${weekDays[dateObj.getDay()]}, ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
      }
      return { dateLabel, matches: matchesInGroup };
    });
  });

  // Cast match to MatchCardData for the card component (single or array)
  protected toCardData(m: Match): MatchCardData;
  protected toCardData(m: Match[]): MatchCardData[];
  protected toCardData(m: Match | Match[]): MatchCardData | MatchCardData[] {
    return m as any;
  }

  ngOnInit(): void {
    this.fetchMatches();
  }

  protected fetchMatches(): void {
    this.loadingMatches.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    this.http.get<Match[]>(`${this.apiBaseUrl}/matches`, { headers }).subscribe({
      next: (list) => {
        const sorted = list.sort((a, b) => {
          const order = { live: 0, upcoming: 1, finished: 2, cancelled: 3 };
          const oa = order[a.status] ?? 4, ob = order[b.status] ?? 4;
          if (oa !== ob) return oa - ob;
          const da = new Date(a.scheduled_at).getTime(), db = new Date(b.scheduled_at).getTime();
          return a.status === 'finished' ? db - da : da - db;
        });
        this.matches.set(sorted);
        this.loadingMatches.set(false);
      },
      error: () => this.loadingMatches.set(false),
    });
  }

  protected selectMatch(matchId: string): void {
    this.selectedMatchId.set(matchId);
  }

  protected goBack(): void {
    this.selectedMatchId.set(null);
    this.fetchMatches();
  }
}
