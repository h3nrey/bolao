import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: 'avamec' | 'siscad' | 'inovaula' | 'materiais-digitais' | 'outro' | null;
  seniority?: 'bolsista' | 'clt' | 'gerente' | 'pmo' | 'outro' | null;
  created_at?: string;
  updated_at?: string;
  can_edit?: boolean;
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
  private readonly apiBaseUrl = 'http://localhost:3000';

  private readonly profileUser = signal<UserProfile | null>(null);

  // Computed that acts as the 'user' selector for the template
  protected readonly user = computed(() => this.profileUser());

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== this.session.user()?.id) {
        this.fetchUserProfile(id);
      } else {
        const me = this.session.user();
        if (me) {
          me.can_edit = true;
        }
        this.profileUser.set(me);
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

  protected getProjectLabel(project: string | null | undefined): string {
    if (!project) return 'Não definido';
    const mapping: Record<string, string> = {
      'avamec': 'AVAMEC',
      'siscad': 'SISCAD',
      'inovaula': 'Inovaula',
      'materiais-digitais': 'Materiais Digitais',
      'outro': 'Outro'
    };
    return mapping[project] || project;
  }

  protected getSeniorityLabel(seniority: string | null | undefined): string {
    if (!seniority) return 'Não definido';
    const mapping: Record<string, string> = {
      'bolsista': 'Bolsista',
      'clt': 'CLT',
      'gerente': 'Gerente',
      'pmo': 'PMO',
      'outro': 'Outro'
    };
    return mapping[seniority] || seniority;
  }

  protected onLogout(): void {
    this.session.logout();
    this.router.navigate(['/ranking']);
  }
}
