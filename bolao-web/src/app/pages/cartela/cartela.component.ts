import { Component, input, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CartelaTableComponent } from './components/cartela-table/cartela-table.component';
import { CartelaMatchComponent } from './components/cartela-match/cartela-match.component';
import { RoundSelectorComponent } from '../../components/ui/round-selector/round-selector.component';
import { SessionService } from '../../services/session.service';

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
  imports: [CommonModule, FormsModule, CartelaTableComponent, CartelaMatchComponent, RoundSelectorComponent],
  templateUrl: './cartela.component.html',
})
export class CartelaComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';
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

      // Calculate standings for this group (using all group matches)
      const teamMap: { [teamId: string]: { team: MatchTeam; P: number; J: number; V: number; E: number; D: number; SG: number; GP: number; GC: number } } = {};

      for (const m of g.matches) {
        if (m.team_a && !teamMap[m.team_a.id]) {
          teamMap[m.team_a.id] = { team: m.team_a, P: 0, J: 0, V: 0, E: 0, D: 0, SG: 0, GP: 0, GC: 0 };
        }
        if (m.team_b && !teamMap[m.team_b.id]) {
          teamMap[m.team_b.id] = { team: m.team_b, P: 0, J: 0, V: 0, E: 0, D: 0, SG: 0, GP: 0, GC: 0 };
        }
      }

      for (const m of g.matches) {
        if (!m.team_a || !m.team_b) continue;

        let scoreA = 0;
        let scoreB = 0;

        const localPred = preds[m.id];
        if (localPred) {
          scoreA = localPred.scoreA;
          scoreB = localPred.scoreB;
        }
        const played = true;

        if (played) {
          const tA = teamMap[m.team_a.id];
          const tB = teamMap[m.team_b.id];

          tA.J++;
          tB.J++;
          tA.GP += scoreA;
          tA.GC += scoreB;
          tB.GP += scoreB;
          tB.GC += scoreA;

          if (scoreA > scoreB) {
            tA.V++;
            tA.P += 3;
            tB.D++;
          } else if (scoreB > scoreA) {
            tB.V++;
            tB.P += 3;
            tA.D++;
          } else {
            tA.E++;
            tA.P += 1;
            tB.E++;
            tB.P += 1;
          }
        }
      }

      const standingsList = Object.values(teamMap).map(t => {
        t.SG = t.GP - t.GC;
        return t;
      });

      standingsList.sort((a, b) => {
        if (b.P !== a.P) return b.P - a.P;
        if (b.SG !== a.SG) return b.SG - a.SG;
        if (b.GP !== a.GP) return b.GP - a.GP;
        return a.team.name.localeCompare(b.team.name);
      });

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

  protected getMatchDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${weekdays[d.getDay()]}, ${day}/${month}`;
  }
}
