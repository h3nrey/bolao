import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  group?: { id: string; name: string } | null;
}

import { MatchesFilterComponent } from './components/matches-filter/matches-filter.component';
import { ScrollToTopComponent } from '../../components/ui/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-partidas',
  standalone: true,
  imports: [
    CommonModule,
    KnockoutBracketComponent,
    LoadingSpinnerComponent,
    MatchDayGroupComponent,
    LucideCalendar,
    MatchesFilterComponent,
    ScrollToTopComponent,
  ],
  templateUrl: './partidas.component.html',
})
export class PartidasComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  // List state
  protected readonly matches = signal<Match[]>([]);
  protected readonly featuredMatches = signal<Match[]>([]);
  protected readonly loadingMatches = signal(false);

  // Filters state
  protected readonly selectedGroupId = signal<string | null>(null);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly selectedTeamId = signal<string | null>(null);
  protected readonly selectedStatus = signal<string | null>(null);



  // Extract unique groups from matches
  protected readonly groups = computed(() => this.matchesService.getUniqueGroups(this.matches()));

  // Extract unique dates from matches
  protected readonly dates = computed(() => this.matchesService.getUniqueDates(this.matches()));

  // Extract unique teams from matches
  protected readonly teams = computed(() => this.matchesService.getUniqueTeams(this.matches()));

  // Matches grouped by date, filtered by select dropdowns
  protected readonly groupedMatches = computed(() => {
    const rawMatches = this.matches();
    if (!rawMatches.length) return [];

    let filtered = [...rawMatches];

    // Apply group filter
    const selGroup = this.selectedGroupId();
    if (selGroup) {
      filtered = filtered.filter(m => m.group_id === selGroup);
    }

    // Apply date filter
    const selDate = this.selectedDate();
    if (selDate) {
      filtered = filtered.filter(m => {
        const d = new Date(m.scheduled_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return key === selDate;
      });
    }

    // Apply team filter
    const selTeam = this.selectedTeamId();
    if (selTeam) {
      filtered = filtered.filter(m => m.team_a_id === selTeam || m.team_b_id === selTeam);
    }

    // Apply status filter
    const selStatus = this.selectedStatus();
    if (selStatus) {
      filtered = filtered.filter(m => m.status === selStatus);
    }

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

  protected clearFilters(): void {
    this.selectedGroupId.set(null);
    this.selectedDate.set(null);
    this.selectedTeamId.set(null);
    this.selectedStatus.set(null);
  }

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

    this.matchesService.getFeaturedMatches().subscribe({
      next: (list) => {
        this.featuredMatches.set(list);
      },
      error: (err) => console.error('Failed to load featured matches', err)
    });
  }

  protected stageLabel(stage: string): string {
    const labels: Record<string, string> = {
      groups: 'Fase de Grupos',
      round_of_32: 'Mata-mata',
      round_of_16: 'Oitavas de Final',
      quarterfinal: 'Quartas de Final',
      semifinal: 'Semifinal',
      third_place: 'Disputa do 3º Lugar',
      final: 'Final',
    };
    return labels[stage] ?? stage;
  }

  protected selectMatch(matchId: string): void {
    this.router.navigate(['/partidas', matchId]);
  }
}
