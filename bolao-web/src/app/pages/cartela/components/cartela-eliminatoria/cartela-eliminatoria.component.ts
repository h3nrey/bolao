import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CartelaMatchComponent } from '../cartela-match/cartela-match.component';
import { SessionService } from '../../../../services/session.service';
import { MatchesService } from '../../../../services/matches.service';
import { getShortMatchDateLabel, getGroupDateLabel } from '../../../../shared/utils/date.utils';

interface MatchTeam {
  id: string;
  name: string;
  flag_emoji?: string | null;
  flag_url?: string | null;
}

interface Match {
  id: string;
  stage: string;
  round?: string | null;
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
  selector: 'app-cartela-eliminatoria',
  standalone: true,
  imports: [CommonModule, FormsModule, CartelaMatchComponent],
  templateUrl: './cartela-eliminatoria.component.html',
})
export class CartelaEliminatoriaComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);

  protected readonly token = this.session.token;

  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(false);
  
  // Track inputs and saved/modified states dynamically
  protected readonly localPredictions = signal<{ [matchId: string]: LocalPrediction }>({});

  // Active stage signal (timeline selection)
  protected readonly activeStage = signal<string>('round_of_16');

  // Matches filtered by the active stage
  protected readonly filteredMatches = computed(() => {
    const rawMatches = this.matches();
    const current = this.activeStage();

    return rawMatches.filter(m => {
      if (m.stage === 'groups') return false;
      if (m.stage === 'third_place') return false;
      return m.stage === current;
    });
  });

  // Filtered matches grouped by date
  protected readonly groupedMatches = computed(() => {
    const filtered = this.filteredMatches();
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

  ngOnInit(): void {
    this.fetchData();
    this.route.paramMap.subscribe(params => {
      const stageParam = params.get('stage') || 'r16';
      const stageMap: Record<string, string> = {
        'r32': 'round_of_32',
        'r16': 'round_of_16',
        'qf': 'quarterfinal',
        'sf': 'semifinal',
        'final': 'final'
      };
      this.activeStage.set(stageMap[stageParam] || 'round_of_16');
    });
  }

  protected fetchData(): void {
    this.loading.set(true);

    forkJoin({
      matchesList: this.matchesService.getMatches('chronological'),
      myPredictions: this.matchesService.getMyPredictions(),
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
        console.error('Falha ao carregar dados da cartela eliminatória', err);
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
