import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { API_BASE_URL } from '../../config/api.constants';
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

interface PredictionItem {
  type: string;
  value_int: number;
}

interface Prediction {
  id: string;
  match_id: string;
  items: PredictionItem[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
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

  // Mapped dynamic guesses list
  protected readonly userGuesses = computed(() => {
    const preds = this.predictions();
    const mList = this.matches();
    
    if (!preds.length || !mList.length) return [];
    
    return preds.map(p => {
      const match = mList.find(m => m.id === p.match_id);
      if (!match) return null;
      
      const scoreA = p.items.find(i => i.type === 'score_a')?.value_int ?? 0;
      const scoreB = p.items.find(i => i.type === 'score_b')?.value_int ?? 0;
      
      return {
        id: p.id,
        match,
        scoreA,
        scoreB,
        dateLabel: this.getMatchDateLabel(match.scheduled_at)
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
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
