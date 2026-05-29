import { Component, signal, inject, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

// Import standalone page components
import { LoginComponent } from './pages/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CountdownBannerComponent } from './components/ui/countdown-banner/countdown-banner.component';
import { ProfileCompletionModalComponent } from './components/ui/profile-completion-modal/profile-completion-modal.component';
import { SessionService } from './services/session.service';
import {
  ProjectValue,
  SeniorityValue,
} from './shared/constants/profile-options';

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    LoginComponent,
    SidebarComponent,
    CountdownBannerComponent,
    ProfileCompletionModalComponent,
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  // Signals bound to shared SessionService
  protected readonly token = this.session.token;
  protected readonly user = this.session.user;
  protected readonly profileViewUser = this.session.profileViewUser;
  protected readonly isProfileIncomplete = this.session.isProfileIncomplete;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Complete profile form signals
  protected readonly completeProfileName = signal('');
  protected readonly completeProfileProject = signal<ProjectValue | ''>('');
  protected readonly completeProfileSeniority = signal<SeniorityValue | ''>('');
  protected readonly completeProfileError = signal<string | null>(null);
  protected readonly completeProfileLoading = signal(false);

  constructor() {
    // Check if token exists in URL parameters (redirected from callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      // Clear token from browser URL address bar for safety & visual clarity
      window.history.replaceState({}, document.title, window.location.pathname);
      this.token.set(tokenFromUrl);
      this.fetchProfile(tokenFromUrl);
    } else {
      // Check if token exists in localStorage on startup
      const savedToken = localStorage.getItem('bolao_token');
      if (savedToken) {
        this.token.set(savedToken);
        this.fetchProfile(savedToken);
      }
    }
  }

  protected redirectToGoogle(): void {
    window.location.href = `${this.apiBaseUrl}/auth/google`;
  }

  protected onTokenConnected(jwtToken: string): void {
    this.token.set(jwtToken);
    this.fetchProfile(jwtToken);
  }

  private fetchProfile(jwtToken: string): void {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwtToken}`);

    this.http.get<UserProfile>(`${this.apiBaseUrl}/auth/me`, { headers }).subscribe({
      next: (profile) => {
        if (profile) {
          profile.can_edit = true;
          this.completeProfileName.set(profile.name || '');
          this.completeProfileProject.set(profile.project || '');
          this.completeProfileSeniority.set(profile.seniority || '');
        }
        this.user.set(profile);
        this.profileViewUser.set(profile);
        localStorage.setItem('bolao_token', jwtToken);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao autenticar token', err);
        this.error.set('Token inválido ou expirado. Verifique e tente novamente.');
        this.user.set(null);
        this.profileViewUser.set(null);
        this.loading.set(false);
      },
    });
  }

  protected submitProfileUpdate(): void {
    const name = this.completeProfileName().trim();
    const project = this.completeProfileProject();
    const seniority = this.completeProfileSeniority();

    if (!name) {
      this.completeProfileError.set('O nome é obrigatório.');
      return;
    }
    if (!project) {
      this.completeProfileError.set('O projeto é obrigatório.');
      return;
    }
    if (!seniority) {
      this.completeProfileError.set('A senioridade é obrigatória.');
      return;
    }

    this.completeProfileLoading.set(true);
    this.completeProfileError.set(null);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token()}`);
    const body = { name, project, seniority };

    this.http.patch<UserProfile>(`${this.apiBaseUrl}/users/me`, body, { headers }).subscribe({
      next: (updatedProfile) => {
        if (updatedProfile) {
          updatedProfile.can_edit = true;
        }
        this.user.set(updatedProfile);
        this.profileViewUser.set(updatedProfile);
        this.completeProfileLoading.set(false);
      },
      error: (err) => {
        console.error('Falha ao atualizar perfil', err);
        this.completeProfileError.set('Ocorreu um erro ao salvar suas informações. Tente novamente.');
        this.completeProfileLoading.set(false);
      },
    });
  }

  protected viewUserProfile(userId: string): void {
    this.router.navigate(['/perfil', userId]);
  }

  protected viewMyProfile(): void {
    const me = this.user();
    if (me) {
      me.can_edit = true;
    }
    this.profileViewUser.set(me);
    this.router.navigate(['/perfil']);
  }

  protected onTabSelected(tab: 'leaderboard' | 'matches' | 'betsheet' | 'rules' | 'profile' | 'participants'): void {
    const paths = {
      leaderboard: '/ranking',
      participants: '/participantes',
      matches: '/partidas',
      betsheet: '/cartela',
      rules: '/regras',
      profile: '/perfil'
    };
    this.router.navigate([paths[tab]]);
  }

  protected logout(): void {
    this.session.logout();
    this.error.set(null);
    this.router.navigate(['/ranking']);
  }
}
