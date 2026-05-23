import { Component, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import standalone page components
import { LoginComponent } from './pages/login/login.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { PartidasComponent } from './pages/partidas/partidas.component';
import { RegrasComponent } from './pages/regras/regras.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LoginComponent,
    RankingComponent,
    PartidasComponent,
    RegrasComponent,
    PerfilComponent,
    SidebarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';

  // Signals for auth state
  protected readonly token = signal('');
  protected readonly user = signal<UserProfile | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Tabs navigation state
  protected readonly activeTab = signal<'leaderboard' | 'matches' | 'rules' | 'profile'>('leaderboard');

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
        this.user.set(profile);
        localStorage.setItem('bolao_token', jwtToken);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao autenticar token', err);
        this.error.set('Token inválido ou expirado. Verifique e tente novamente.');
        this.user.set(null);
        this.loading.set(false);
      },
    });
  }

  protected logout(): void {
    localStorage.removeItem('bolao_token');
    this.token.set('');
    this.user.set(null);
    this.error.set(null);
    this.activeTab.set('leaderboard');
  }
}
