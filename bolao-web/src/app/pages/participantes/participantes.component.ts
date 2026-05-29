import { Component, input, signal, inject, OnInit, computed, output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TabSelectorComponent, TabOption } from '../../components/ui/tab-selector/tab-selector.component';
import { ParticipantCardComponent } from './components/participant-card/participant-card.component';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

interface RankingUser {
  position: number;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  user_project?: string | null;
  user_seniority?: string | null;
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

  // Read state from SessionService
  protected readonly token = this.session.token;

  // State
  protected readonly allParticipants = signal<RankingUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly activeFilter = signal<string>('all');

  // Project definitions and displays
  protected readonly projectOptions: TabOption[] = [
    { id: 'all', label: 'Todos' },
    { id: 'avamec', label: 'AVAMEC' },
    { id: 'siscad', label: 'SISCAD' },
    { id: 'inovaula', label: 'Inovaula' },
    { id: 'materiais-digitais', label: 'Materiais Digitais' },
    { id: 'outro', label: 'Outro' },
  ];

  // Grouping mapping for display
  private readonly projectDisplayMap: Record<string, string> = {
    'avamec': 'AVAMEC',
    'siscad': 'SISCAD',
    'inovaula': 'Inovaula',
    'materiais-digitais': 'Materiais Digitais',
    'outro': 'Outro'
  };

  // Grouped participants computed property
  protected readonly groupedParticipants = computed<ProjectGroup[]>(() => {
    const participants = this.allParticipants();
    const filter = this.activeFilter();

    // Determine which projects to include
    const projectKeys = filter === 'all'
      ? ['avamec', 'siscad', 'inovaula', 'materiais-digitais', 'outro', 'sem-projeto']
      : [filter];

    const groups: ProjectGroup[] = [];

    for (const key of projectKeys) {
      const isSemProjeto = key === 'sem-projeto';
      const usersInProject = participants.filter(u => {
        if (isSemProjeto) {
          return !u.user_project || !this.projectDisplayMap[u.user_project];
        }
        return u.user_project === key;
      });

      if (usersInProject.length > 0) {
        const totalPoints = usersInProject.reduce((sum, u) => sum + u.pts_total, 0);
        groups.push({
          id: key,
          name: isSemProjeto ? 'Sem Projeto / Não Informado' : (this.projectDisplayMap[key] || key),
          users: usersInProject,
          totalPoints: totalPoints
        });
      }
    }

    return groups;
  });

  protected getSeniorityLabel(seniority: string | null | undefined): string {
    if (!seniority) return 'Participante';
    const mapping: Record<string, string> = {
      'bolsista': 'Bolsista',
      'clt': 'CLT',
      'gerente': 'Gerente',
      'pmo': 'PMO',
      'outro': 'Outro'
    };
    return mapping[seniority] || seniority;
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
      }
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
      }
    });
  }

  protected viewProfile(userId: string): void {
    this.router.navigate(['/perfil', userId]);
  }
}
