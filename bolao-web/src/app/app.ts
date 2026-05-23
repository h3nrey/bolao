import { Component, signal, effect, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000';

  // Signals for state
  protected readonly token = signal('');
  protected readonly user = signal<UserProfile | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

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
    // Redirects current window to Google Auth endpoint on NestJS
    window.location.href = `${this.apiBaseUrl}/auth/google`;
  }

  protected connectToken(): void {
    const rawToken = this.token().trim();
    if (!rawToken) {
      this.error.set('Por favor, insira um token válido.');
      return;
    }
    this.fetchProfile(rawToken);
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
  }
}
