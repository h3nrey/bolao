import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TabSelectorComponent, TabOption } from '../../components/ui/tab-selector/tab-selector.component';
import { ParticipantCardComponent } from './components/participant-card/participant-card.component';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import {
  PROJECT_LABELS,
  PROJECT_VALUES,
  ProjectValue,
  SENIORITY_LABELS,
  SeniorityValue,
} from '../../shared/constants/profile-options';

interface RankingUser {
  position: number;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  user_project?: ProjectValue | null;
  user_seniority?: SeniorityValue | null;
  pts_total: number;
  pts_matches: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface ProjectGroup {
  id: string;
  name: string;
  users: RankingUser[];
  totalPoints: number;
}

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule, TabSelectorComponent, ParticipantCardComponent],
  templateUrl: './participantes.component.html',
})
export class ParticipantesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  protected readonly token = this.session.token;

  protected readonly allParticipants = signal<RankingUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly activeFilter = signal<string>('all');

  protected readonly projectOptions: TabOption[] = [
    { id: 'all', label: 'Todos' },
    ...PROJECT_VALUES.map((value) => ({ id: value, label: PROJECT_LABELS[value] })),
  ];

  protected readonly groupedParticipants = computed<ProjectGroup[]>(() => {
    const participants = this.allParticipants();
    const filter = this.activeFilter();

    const projectKeys = filter === 'all' ? [...PROJECT_VALUES, 'sem-projeto'] : [filter];
    const groups: ProjectGroup[] = [];

    for (const key of projectKeys) {
      const isSemProjeto = key === 'sem-projeto';
      const usersInProject = participants.filter((user) => {
        if (isSemProjeto) {
          return !user.user_project || !PROJECT_LABELS[user.user_project];
        }

        return user.user_project === key;
      });

      if (usersInProject.length > 0) {
        const totalPoints = usersInProject.reduce((sum, user) => sum + user.pts_total, 0);
        groups.push({
          id: key,
          name: isSemProjeto ? 'Sem Projeto / Não Informado' : (PROJECT_LABELS[key as ProjectValue] || key),
          users: usersInProject,
          totalPoints,
        });
      }
    }

    return groups;
  });

  protected getSeniorityLabel(seniority: string | null | undefined): string {
    if (!seniority) return 'Participante';
    return SENIORITY_LABELS[seniority as SeniorityValue] || seniority;
  }

  ngOnInit(): void {
    this.fetchTournamentsAndRankings();
  }

  private fetchTournamentsAndRankings(): void {
    this.loading.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);

    this.http.get<Tournament[]>(`${this.apiBaseUrl}/tournaments`, { headers }).subscribe({
      next: (list) => {
        if (list.length > 0) {
          const activeTournament = list[0];
          this.fetchRankings(activeTournament.id);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Falha ao carregar torneios', err);
        this.loading.set(false);
      },
    });
  }

  private fetchRankings(tournamentId: string): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    this.http.get<RankingUser[]>(`${this.apiBaseUrl}/rankings?tournament_id=${tournamentId}`, { headers }).subscribe({
      next: (data) => {
        this.allParticipants.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar rankings', err);
        this.loading.set(false);
      },
    });
  }

  protected viewProfile(userId: string): void {
    this.router.navigate(['/perfil', userId]);
  }
}
