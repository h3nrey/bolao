import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { API_BASE_URL } from '../../config/api.constants';
import { LucideCalendar, LucideClipboardList, LucideLoaderCircle, LucideLogOut, LucideUser } from '@lucide/angular';
import {
  PROJECT_LABELS,
  ProjectValue,
  SENIORITY_LABELS,
  SeniorityValue,
} from '../../shared/constants/profile-options';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: ProjectValue | null;
  seniority?: SeniorityValue | null;
  created_at?: string;
  updated_at?: string;
  can_edit?: boolean;
}

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
  team_a?: MatchTeam | null;
  team_b?: MatchTeam | null;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: string;
  score?: { score_a: number; score_b: number } | null;
}

interface PredictionPoint {
  id: string;
  type: string;
  pts_earned: number;
}

interface PredictionItem {
  type: string;
  value_int: number;
}

interface Prediction {
  id: string;
  match_id: string;
  items: PredictionItem[];
  points?: PredictionPoint[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideCalendar, LucideClipboardList, LucideLoaderCircle, LucideLogOut, LucideUser],
  templateUrl: './perfil.component.html',
})
export class PerfilComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly apiBaseUrl = API_BASE_URL;

  private readonly profileUser = signal<UserProfile | null>(null);

  // Guesses states
  protected readonly matches = signal<Match[]>([]);
  protected readonly predictions = signal<Prediction[]>([]);
  protected readonly loadingPredictions = signal(false);

  // Computed that acts as the 'user' selector for the template
  protected readonly user = computed(() => this.profileUser());

  // Mapped dynamic guesses list grouped by matchday
  protected readonly userGuesses = computed(() => {
    const preds = this.predictions();
    const mList = this.matches();
    
    if (!preds.length || !mList.length) return [];
    
    const pointLabels: Record<string, string> = {
      exact_score: 'Placar Exato',
      result: 'Resultado',
      goals_a: 'Gols do Time A',
      goals_b: 'Gols do Time B',
      total_goals: 'Total de Gols',
      bonus_zero_zero: 'Bônus 0x0',
      bonus_extra_time: 'Bônus Prorrog.',
      bonus_penalties: 'Bônus Pênaltis',
    };
    
    const mapped = preds.map(p => {
      const match = mList.find(m => m.id === p.match_id);
      if (!match) return null;
      
      const scoreA = p.items.find(i => i.type === 'score_a')?.value_int ?? 0;
      const scoreB = p.items.find(i => i.type === 'score_b')?.value_int ?? 0;
      
      const ptsTotal = p.points?.reduce((sum, pt) => sum + pt.pts_earned, 0) ?? 0;
      
      const pointsBreakdown = p.points?.map(pt => ({
        label: pointLabels[pt.type] || pt.type,
        pts: pt.pts_earned
      })) ?? [];
      
      let badgeClass = 'bg-[#14151A] text-[#5C5C72] border-[#2A2B36]';
      if (match.status === 'finished') {
        const hasExact = p.points?.some(pt => pt.type === 'exact_score');
        const hasResult = p.points?.some(pt => pt.type === 'result');
        
        if (hasExact) {
          badgeClass = 'bg-[#00D68F]/10 text-[#00D68F] border-[#00D68F]/30';
        } else if (hasResult) {
          badgeClass = 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30';
        } else if (ptsTotal > 0) {
          badgeClass = 'bg-[#0095FF]/10 text-[#0095FF] border-[#0095FF]/30';
        } else {
          badgeClass = 'bg-[#FF1A35]/10 text-[#FF1A35] border-[#E8001D]/30';
        }
      }
      
      return {
        id: p.id,
        match,
        scoreA,
        scoreB,
        ptsTotal,
        pointsBreakdown,
        badgeClass,
        dateLabel: this.getMatchDateLabel(match.scheduled_at)
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    // Group guesses by matchday (round)
    const groups: Record<string, { roundLabel: string; minTime: number; guesses: any[] }> = {};
    
    for (const guess of mapped) {
      let roundLabel = guess.match.round;
      if (!roundLabel) {
        const stageTranslations: Record<string, string> = {
          groups: 'Fase de Grupos',
          round_of_32: 'Dezesseis-avos de Final',
          round_of_16: 'Oitavas de Final',
          quarterfinal: 'Quartas de Final',
          semifinal: 'Semifinal',
          third_place: 'Disputa de 3º Lugar',
          final: 'Grande Final',
        };
        roundLabel = stageTranslations[guess.match.stage] || 'Copa do Mundo';
      } else if (roundLabel.startsWith('Matchday ')) {
        roundLabel = roundLabel.replace('Matchday ', 'Rodada ');
      }

      if (!groups[roundLabel]) {
        groups[roundLabel] = {
          roundLabel,
          minTime: new Date(guess.match.scheduled_at).getTime(),
          guesses: []
        };
      } else {
        const time = new Date(guess.match.scheduled_at).getTime();
        if (time < groups[roundLabel].minTime) {
          groups[roundLabel].minTime = time;
        }
      }
      groups[roundLabel].guesses.push(guess);
    }
    
    // Sort groups chronologically by the earliest match in the group, and sort guesses inside
    return Object.values(groups)
      .sort((a, b) => a.minTime - b.minTime)
      .map(g => {
        g.guesses.sort((a, b) => new Date(a.match.scheduled_at).getTime() - new Date(b.match.scheduled_at).getTime());
        return g;
      });
  });

  // Total predictions/guesses count
  protected readonly totalGuessesCount = computed(() => {
    const groups = this.userGuesses();
    return groups.reduce((acc, group) => acc + group.guesses.length, 0);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const targetId = id || this.session.user()?.id;

      if (id && id !== this.session.user()?.id) {
        this.fetchUserProfile(id);
      } else {
        const me = this.session.user();
        if (me) {
          me.can_edit = true;
        }
        this.profileUser.set(me);
      }

      if (targetId) {
        this.fetchGuesses(targetId);
      }
    });
  }

  private fetchUserProfile(userId: string): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    this.http.get<UserProfile>(`${this.apiBaseUrl}/users/${userId}`, { headers }).subscribe({
      next: (profile) => {
        this.profileUser.set(profile);
      },
      error: (err) => {
        console.error('Falha ao carregar perfil do participante', err);
        this.profileUser.set(null);
      }
    });
  }

  private fetchGuesses(userId: string): void {
    this.loadingPredictions.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    
    this.http.get<Match[]>(`${this.apiBaseUrl}/matches`, { headers }).subscribe({
      next: (matchesList) => {
        this.matches.set(matchesList);
        
        const endpoint = userId === this.session.user()?.id 
          ? `${this.apiBaseUrl}/predictions/me` 
          : `${this.apiBaseUrl}/predictions/user/${userId}`;
          
        this.http.get<Prediction[]>(endpoint, { headers }).subscribe({
          next: (preds) => {
            this.predictions.set(preds);
            this.loadingPredictions.set(false);
          },
          error: (err) => {
            console.error('Falha ao carregar palpites', err);
            this.loadingPredictions.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Falha ao carregar partidas', err);
        this.loadingPredictions.set(false);
      }
    });
  }

  protected getProjectLabel(project: string | null | undefined): string {
    if (!project) return 'Não definido';
    return PROJECT_LABELS[project as ProjectValue] || project;
  }

  protected getSeniorityLabel(seniority: string | null | undefined): string {
    if (!seniority) return 'Não definido';
    return SENIORITY_LABELS[seniority as SeniorityValue] || seniority;
  }

  protected getMatchDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${weekdays[d.getDay()]}, ${day}/${month}`;
  }

  protected onLogout(): void {
    this.session.logout();
    this.router.navigate(['/ranking']);
  }
}
