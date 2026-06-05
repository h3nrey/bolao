import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabSelectorComponent, TabOption } from '../../components/ui/tab-selector/tab-selector.component';
import { KnockoutBracketComponent } from '../../components/ui/knockout-bracket/knockout-bracket.component';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner/loading-spinner.component';
import { MatchCardData } from './components/match-card/match-card.component';
import { MatchDayGroupComponent } from './components/match-day-group/match-day-group.component';
import { SessionService } from '../../services/session.service';
import { MatchesService } from '../../services/matches.service';
import { getGroupDateLabel } from '../../shared/utils/date.utils';
import { LucideCalendar } from '@lucide/angular';

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
    MatchDayGroupComponent,
    LucideCalendar,
  ],
  templateUrl: './partidas.component.html',
})
export class PartidasComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  // List state
  protected readonly matches = signal<Match[]>([]);
  protected readonly loadingMatches = signal(false);
  protected readonly activeStage = signal<'groups' | 'knockout'>('groups');

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

    return Object.keys(groups).sort().map(key => {
      const matchesInGroup = groups[key];
      const dateLabel = getGroupDateLabel(matchesInGroup[0].scheduled_at);
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
    this.matchesService.getMatches('status').subscribe({
      next: (list) => {
        this.matches.set(list);
        this.loadingMatches.set(false);
      },
      error: () => this.loadingMatches.set(false),
    });
  }

  protected selectMatch(matchId: string): void {
    this.router.navigate(['/partidas', matchId]);
  }
}
