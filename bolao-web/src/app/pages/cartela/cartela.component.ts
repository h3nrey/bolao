import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CartelaTableComponent } from './components/cartela-table/cartela-table.component';
import { CartelaMatchComponent } from './components/cartela-match/cartela-match.component';
import { RoundSelectorComponent } from '../../components/ui/round-selector/round-selector.component';
import { SessionService } from '../../services/session.service';
import { MatchesService } from '../../services/matches.service';
import { getShortMatchDateLabel } from '../../shared/utils/date.utils';
import { calculateGroupStandings } from '../../shared/utils/standings.utils';

interface MatchTeam {
  id: string;
  name: string;
  flag_emoji?: string | null;
  flag_url?: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface Match {
  id: string;
  stage: string;
  round?: string | null;
  group_id?: string | null;
  group?: Group | null;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  team_a?: MatchTeam | null;
  team_b?: MatchTeam | null;
  score?: { score_a: number; score_b: number } | null;
}

interface LocalPrediction {
  scoreA: number | null;
  scoreB: number | null;
  isSaved: boolean;
  isModified: boolean;
  isSaving: boolean;
  error?: string | null;
}

@Component({
  selector: 'app-cartela',
  standalone: true,
  imports: [CommonModule, FormsModule, CartelaTableComponent, CartelaMatchComponent, RoundSelectorComponent],
  templateUrl: './cartela.component.html',
})
export class CartelaComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly session = inject(SessionService);

  protected readonly token = this.session.token;

  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(false);
  
  // Track inputs and saved/modified states dynamically
  protected readonly localPredictions = signal<{ [matchId: string]: LocalPrediction }>({});

  // Track active round index per group
  protected readonly currentGroupRoundIndex = signal<{ [groupName: string]: number }>({});

  // Groups of matches with their classification standings calculated in real time
  protected readonly groupSections = computed(() => {
    const rawMatches = this.matches();
    const preds = this.localPredictions();

    const groupMap: { [groupName: string]: { id: string; name: string; matches: Match[] } } = {};
    for (const m of rawMatches) {
      if (m.stage === 'groups' && m.group) {
        const groupName = m.group.name;
        if (!groupMap[groupName]) {
          groupMap[groupName] = {
            id: m.group.id,
            name: groupName,
            matches: []
          };
        }
        groupMap[groupName].matches.push(m);
      }
    }

    const sortedGroupNames = Object.keys(groupMap).sort();

    return sortedGroupNames.map(name => {
      const g = groupMap[name];

      // Get all unique rounds from this group's matches
      const rounds = Array.from(new Set(g.matches.map(m => m.round || ''))).filter(Boolean);
      // Natural sort by round number: "Matchday 8" -> 8
      rounds.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      const activeIdx = this.currentGroupRoundIndex()[name] ?? 0;
      const validIdx = Math.max(0, Math.min(activeIdx, rounds.length - 1));
      const activeRound = rounds[validIdx] || '';

      // Filter matches by active round
      const filteredMatches = g.matches.filter(m => m.round === activeRound);

      // Calculate standings for this group via standings utility
      const standingsList = calculateGroupStandings(g.matches, preds);

      return {
        id: g.id,
        name: g.name,
        matches: filteredMatches,
        standings: standingsList,
        allRounds: rounds,
        activeRound: activeRound,
        activeRoundLabel: `${validIdx + 1}ª Rodada`,
        hasPrevRound: validIdx > 0,
        hasNextRound: validIdx < rounds.length - 1
      };
    });
  });

  protected scrollToGroup(groupName: string): void {
    const targetId = 'group-' + groupName.replace(/\s+/g, '-');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected prevRound(groupName: string, maxRounds: number): void {
    const dict = { ...this.currentGroupRoundIndex() };
    const current = dict[groupName] ?? 0;
    if (current > 0) {
      dict[groupName] = current - 1;
      this.currentGroupRoundIndex.set(dict);
    }
  }

  protected nextRound(groupName: string, maxRounds: number): void {
    const dict = { ...this.currentGroupRoundIndex() };
    const current = dict[groupName] ?? 0;
    if (current < maxRounds - 1) {
      dict[groupName] = current + 1;
      this.currentGroupRoundIndex.set(dict);
    }
  }

  ngOnInit(): void {
    this.fetchData();
  }

  protected fetchData(): void {
    this.loading.set(true);

    forkJoin({
      matchesList: this.matchesService.getMatches('chronological'),
      myPredictions: this.matchesService.getMyPredictions(),
    }).subscribe({
      next: ({ matchesList, myPredictions }) => {
        this.matches.set(matchesList);

        const dict: { [matchId: string]: LocalPrediction } = {};
        for (const match of matchesList) {
          const pred = myPredictions.find(p => p.match_id === match.id);
          if (pred) {
            const itemA = pred.items?.find((i: any) => i.type === 'score_a');
            const itemB = pred.items?.find((i: any) => i.type === 'score_b');
            dict[match.id] = {
              scoreA: itemA && itemA.value_int !== undefined && itemA.value_int !== null ? itemA.value_int : null,
              scoreB: itemB && itemB.value_int !== undefined && itemB.value_int !== null ? itemB.value_int : null,
              isSaved: true,
              isModified: false,
              isSaving: false
            };
          } else {
            dict[match.id] = {
              scoreA: null,
              scoreB: null,
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
    if (!pred || pred.isSaving || pred.scoreA === null || pred.scoreB === null) return;

    pred.isSaving = true;
    pred.error = null;
    this.localPredictions.set(dict);

    this.matchesService.savePrediction(matchId, pred.scoreA, pred.scoreB).subscribe({
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

  protected getMatchDateLabel(dateStr: string): string {
    return getShortMatchDateLabel(dateStr);
  }
}
