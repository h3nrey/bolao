import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionService } from '../../../services/session.service';
import { API_BASE_URL } from '../../../config/api.constants';
import { LucideCheck, LucideX, LucideInfo } from '@lucide/angular';
import { SwitchComponent } from '../../../components/ui/switch/switch.component';

@Component({
  selector: 'app-admin-regras',
  standalone: true,
  imports: [
    CommonModule,
    LucideCheck,
    LucideX,
    LucideInfo,
    SwitchComponent,
  ],
  templateUrl: './regras.component.html',
})
export class AdminRegrasComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly apiBaseUrl = API_BASE_URL;

  protected readonly loading = signal(false);
  protected readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  protected readonly specialPredictionsActive = signal<boolean>(true);
  protected readonly tournamentId = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchTournamentStatus();
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4500);
  }

  protected fetchTournamentStatus(): void {
    this.loading.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    this.http.get<any[]>(`${this.apiBaseUrl}/tournaments`, { headers }).subscribe({
      next: (tournaments) => {
        if (tournaments && tournaments.length > 0) {
          const activeTournament = tournaments[0];
          this.tournamentId.set(activeTournament.id);
          this.specialPredictionsActive.set(activeTournament.special_predictions_active);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar status do torneio', err);
        this.loading.set(false);
      },
    });
  }

  protected toggleSpecialPredictions(): void {
    const tId = this.tournamentId();
    if (!tId) return;

    const nextVal = !this.specialPredictionsActive();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    const body = {
      special_predictions_active: nextVal
    };

    this.loading.set(true);
    this.http.patch<any>(`${this.apiBaseUrl}/tournaments/${tId}`, body, { headers }).subscribe({
      next: (updated) => {
        this.specialPredictionsActive.set(updated.special_predictions_active);
        this.showFeedback('success', `Palpites especiais agora estão ${updated.special_predictions_active ? 'abertos' : 'fechados'}!`);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao atualizar status dos palpites especiais', err);
        this.showFeedback('error', 'Ocorreu um erro ao alterar o status dos palpites especiais.');
        this.loading.set(false);
      }
    });
  }
}
