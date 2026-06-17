import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchesService } from '../../../../services/matches.service';
import { FormSelectComponent, SelectOption } from '../../../../components/ui/form-select/form-select.component';
import { ModalComponent } from '../../../../components/ui/modal/modal.component';
import { TabSelectorComponent, TabOption } from '../../../../components/ui/tab-selector/tab-selector.component';
import { ScoreInputComponent } from '../../../../components/ui/score-input/score-input.component';
import { LucideX, LucidePlus, LucideTrash2, LucideSettings, LucideMinus } from '@lucide/angular';

@Component({
  selector: 'app-admin-match-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormSelectComponent,
    ModalComponent,
    TabSelectorComponent,
    ScoreInputComponent,
    LucideX,
    LucidePlus,
    LucideTrash2,
    LucideSettings,
    LucideMinus
  ],
  templateUrl: './admin-match-edit-modal.component.html',
})
export class AdminMatchEditModalComponent {
  private readonly matchesService = inject(MatchesService);

  isOpen = input.required<boolean>();
  match = input.required<any>();

  close = output<void>();
  saved = output<void>();

  // Tabs state
  protected readonly activeTabId = signal<string>('general');
  protected readonly tabOptions: TabOption[] = [
    { id: 'general', label: 'Geral' },
    { id: 'events', label: 'Gols e Eventos' }
  ];

  // Form Signals for Match Details
  protected readonly status = signal<string>('upcoming');
  protected readonly scoreA = signal<number>(0);
  protected readonly scoreB = signal<number>(0);
  protected readonly cardsQuantity = signal<number>(0);
  protected readonly cornersQuantity = signal<number>(0);

  // Form Signals for Adding Goal Event
  protected readonly eventTeamId = signal<string>('');
  protected readonly eventPlayerId = signal<string>('');
  protected readonly eventMinute = signal<number>(1);
  protected readonly eventType = signal<string>('goal');
  protected readonly eventPeriod = signal<string>('regular');

  // General Modal State
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly statusOptions: SelectOption[] = [
    { value: 'upcoming', label: 'Agendado (Upcoming)' },
    { value: 'live', label: 'Em Andamento (Live)' },
    { value: 'finished', label: 'Finalizado (Finished)' },
    { value: 'cancelled', label: 'Cancelado (Cancelled)' },
  ];

  protected readonly periodOptions: SelectOption[] = [
    { value: 'regular', label: 'Tempo Normal' },
    { value: 'extra_time', label: 'Prorrogação' },
  ];

  protected readonly typeOptions: SelectOption[] = [
    { value: 'goal', label: 'Gol' },
    { value: 'own_goal', label: 'Gol Contra' },
  ];

  constructor() {
    // Populate form values when the match changes
    effect(() => {
      const m = this.match();
      if (m) {
        this.status.set(m.status);
        this.scoreA.set(m.score_a || 0);
        this.scoreB.set(m.score_b || 0);
        this.cardsQuantity.set(m.cards_quantity || 0);
        this.cornersQuantity.set(m.corners_quantity || 0);

        // Pre-select first team options
        this.eventTeamId.set(m.team_a_id || '');
        this.eventPlayerId.set('');
        this.eventMinute.set(1);
        this.eventType.set('goal');
        this.eventPeriod.set('regular');
      }
    });
  }

  // Dynamic Options: Teams list
  protected readonly teamOptions = computed<SelectOption[]>(() => {
    const m = this.match();
    if (!m) return [];
    const options: SelectOption[] = [];
    if (m.team_a) {
      options.push({ value: m.team_a.id, label: `${m.team_a.flag_emoji || '🏳️'} ${m.team_a.name}` });
    }
    if (m.team_b) {
      options.push({ value: m.team_b.id, label: `${m.team_b.flag_emoji || '🏳️'} ${m.team_b.name}` });
    }
    return options;
  });

  // Dynamic Options: Players list based on selected team
  protected readonly playerOptions = computed<SelectOption[]>(() => {
    const m = this.match();
    const selectedTeamId = this.eventTeamId();
    if (!m || !selectedTeamId) return [];

    const team = m.team_a?.id === selectedTeamId ? m.team_a : (m.team_b?.id === selectedTeamId ? m.team_b : null);
    if (!team || !team.players) return [];

    const options: SelectOption[] = [{ value: '', label: 'Sem jogador / Desconhecido' }];
    team.players.forEach((p: any) => {
      options.push({
        value: p.id,
        label: `${p.name} (${p.number || 'S/N'})`
      });
    });
    
    return options.sort((a, b) => a.label.localeCompare(b.label));
  });

  protected submitMatchUpdate(): void {
    const m = this.match();
    if (!m) return;

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      status: this.status(),
      score_a: Number(this.scoreA()),
      score_b: Number(this.scoreB()),
      cards_quantity: Number(this.cardsQuantity()),
      corners_quantity: Number(this.cornersQuantity()),
    };

    this.matchesService.updateMatch(m.id, payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Falha ao atualizar partida', err);
        this.error.set(err.error?.message || 'Erro ao atualizar a partida.');
        this.loading.set(false);
      }
    });
  }

  protected submitAddGoalEvent(): void {
    const m = this.match();
    if (!m || !this.eventTeamId()) return;

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      team_id: this.eventTeamId(),
      player_id: this.eventPlayerId() || undefined,
      type: this.eventType(),
      minute: Number(this.eventMinute()),
      period: this.eventPeriod(),
    };

    this.matchesService.createMatchEvent(m.id, payload).subscribe({
      next: () => {
        this.loading.set(false);
        // Refresh event inputs
        this.eventPlayerId.set('');
        this.eventMinute.set(1);
        this.saved.emit(); // Emit saved to trigger data reload in parent
      },
      error: (err) => {
        console.error('Falha ao adicionar gol', err);
        this.error.set(err.error?.message || 'Erro ao adicionar evento de gol.');
        this.loading.set(false);
      }
    });
  }

  protected deleteGoalEvent(eventId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.matchesService.deleteMatchEvent(eventId).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.emit(); // Emit saved to trigger data reload in parent
      },
      error: (err) => {
        console.error('Falha ao deletar gol', err);
        this.error.set(err.error?.message || 'Erro ao deletar evento.');
        this.loading.set(false);
      }
    });
  }
}
