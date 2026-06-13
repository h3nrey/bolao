import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../../services/session.service';
import { API_BASE_URL } from '../../../config/api.constants';
import { FormSelectComponent, SelectOption } from '../../../components/ui/form-select/form-select.component';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { MatchesService } from '../../../services/matches.service';
import {
  LucideSearch,
  LucideEdit2,
  LucideTrash2,
  LucideX,
  LucideCheck,
  LucideInfo,
  LucideCalendar,
} from '@lucide/angular';

interface Team {
  id: string;
  name: string;
  flag_emoji?: string | null;
  flag_url?: string | null;
  external_id?: string | null;
}

interface Match {
  id: string;
  phase_id: string;
  group_id?: string | null;
  stage: 'groups' | 'round_of_32' | 'round_of_16' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final';
  round?: string | null;
  team_a_id?: string | null;
  team_b_id?: string | null;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  score_a: number;
  score_b: number;
  score_a_extra: number;
  score_b_extra: number;
  penalty_score_a?: number | null;
  penalty_score_b?: number | null;
  team_a?: Team | null;
  team_b?: Team | null;
  group?: { id: string; name: string } | null;
  phase?: { id: string; name: string } | null;
}

@Component({
  selector: 'app-admin-partidas',
  standalone: true,
  imports: [
    CommonModule,
    FormSelectComponent,
    ModalComponent,
    LucideSearch,
    LucideEdit2,
    LucideTrash2,
    LucideX,
    LucideCheck,
    LucideInfo,
    LucideCalendar,
  ],
  templateUrl: './partidas.component.html',
})
export class PartidasComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly matchesService = inject(MatchesService);
  private readonly apiBaseUrl = API_BASE_URL;

  // General State Signals
  protected readonly loading = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Matches State Signals
  protected readonly matchesList = signal<Match[]>([]);
  protected readonly phasesList = signal<any[]>([]);
  protected readonly teamsList = signal<Team[]>([]);
  protected readonly selectedMatch = signal<Match | null>(null);

  // Search & Filter Signals
  protected readonly searchQuery = signal('');

  // Modal Signals for Matches
  protected readonly isCreateMatchModalOpen = signal(false);
  protected readonly isEditMatchModalOpen = signal(false);
  protected readonly isDeleteMatchModalOpen = signal(false);
  protected readonly modalLoading = signal(false);
  protected readonly modalError = signal<string | null>(null);

  // Form Signals for Matches
  protected readonly createMatchPhaseId = signal('');
  protected readonly createMatchGroupId = signal('');
  protected readonly createMatchStage = signal('groups');
  protected readonly createMatchRound = signal('');
  protected readonly createMatchTeamAId = signal('');
  protected readonly createMatchTeamBId = signal('');
  protected readonly createMatchScheduledAt = signal('');

  protected readonly editMatchPhaseId = signal('');
  protected readonly editMatchGroupId = signal('');
  protected readonly editMatchStage = signal('groups');
  protected readonly editMatchRound = signal('');
  protected readonly editMatchTeamAId = signal('');
  protected readonly editMatchTeamBId = signal('');
  protected readonly editMatchScheduledAt = signal('');
  protected readonly editMatchStatus = signal('upcoming');
  protected readonly editMatchScoreA = signal(0);
  protected readonly editMatchScoreB = signal(0);
  protected readonly editMatchScoreAExtra = signal(0);
  protected readonly editMatchScoreBExtra = signal(0);
  protected readonly editMatchPenaltyScoreA = signal<number | null>(null);
  protected readonly editMatchPenaltyScoreB = signal<number | null>(null);

  protected readonly stageOptions: SelectOption[] = [
    { value: 'groups', label: 'Fase de Grupos' },
    { value: 'round_of_32', label: 'Dezesseis-avos (32 avos)' },
    { value: 'round_of_16', label: 'Oitavas de Final' },
    { value: 'quarterfinal', label: 'Quartas de Final' },
    { value: 'semifinal', label: 'Semifinal' },
    { value: 'third_place', label: 'Terceiro Lugar' },
    { value: 'final', label: 'Final' },
  ];

  protected readonly statusOptions: SelectOption[] = [
    { value: 'upcoming', label: 'Agendado (Upcoming)' },
    { value: 'live', label: 'Em Andamento (Live)' },
    { value: 'finished', label: 'Finalizado (Finished)' },
    { value: 'cancelled', label: 'Cancelado (Cancelled)' },
  ];

  // Dynamically Filtered Matches List
  protected readonly filteredMatches = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    let list = this.matchesList();

    if (query) {
      list = list.filter(
        (m) =>
          (m.team_a && m.team_a.name.toLowerCase().includes(query)) ||
          (m.team_b && m.team_b.name.toLowerCase().includes(query)) ||
          (m.stage && m.stage.toLowerCase().includes(query)) ||
          (m.round && m.round.toLowerCase().includes(query)) ||
          (m.group && m.group.name.toLowerCase().includes(query)) ||
          (m.phase && m.phase.name.toLowerCase().includes(query))
      );
    }

    return list;
  });

  // Dynamically filtered groups options for match forms
  protected readonly createMatchGroups = computed<SelectOption[]>(() => {
    const phaseId = this.createMatchPhaseId();
    const phase = this.phasesList().find((p) => p.id === phaseId);
    if (!phase || !phase.groups) return [];
    return phase.groups.map((g: any) => ({ value: g.id, label: g.name }));
  });

  protected readonly editMatchGroups = computed<SelectOption[]>(() => {
    const phaseId = this.editMatchPhaseId();
    const phase = this.phasesList().find((p) => p.id === phaseId);
    if (!phase || !phase.groups) return [];
    return phase.groups.map((g: any) => ({ value: g.id, label: g.name }));
  });

  // SelectOption mapped teams list for match dropdown selectors
  protected readonly teamSelectOptions = computed<SelectOption[]>(() => {
    return this.teamsList().map((t) => ({
      value: t.id,
      label: `${t.flag_emoji || '🏳️'} ${t.name}`,
    }));
  });

  // SelectOption mapped phases list
  protected readonly phaseSelectOptions = computed<SelectOption[]>(() => {
    return this.phasesList().map((p) => ({
      value: p.id,
      label: p.name,
    }));
  });

  ngOnInit(): void {
    this.fetchMatches();
    this.fetchPhases();
    this.fetchTeams();
  }

  // Display success/error alerts
  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4500);
  }

  protected fetchMatches(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.matchesService.getMatches('chronological').subscribe({
      next: (data) => {
        this.matchesList.set(data as Match[]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar partidas', err);
        this.apiError.set('Falha ao carregar partidas.');
        this.loading.set(false);
      },
    });
  }

  protected fetchPhases(): void {
    this.matchesService.getPhases().subscribe({
      next: (data) => {
        this.phasesList.set(data);
      },
      error: (err) => console.error('Falha ao carregar fases', err),
    });
  }

  protected fetchTeams(): void {
    this.http.get<Team[]>(`${this.apiBaseUrl}/teams`).subscribe({
      next: (data) => {
        this.teamsList.set(data);
      },
      error: (err) => {
        console.error('Falha ao carregar seleções', err);
      },
    });
  }

  // Match Action Handlers
  protected openCreateMatchModal(): void {
    this.createMatchPhaseId.set(this.phasesList()[0]?.id || '');
    this.createMatchGroupId.set('');
    this.createMatchStage.set('groups');
    this.createMatchRound.set('');
    this.createMatchTeamAId.set('');
    this.createMatchTeamBId.set('');
    this.createMatchScheduledAt.set('');
    this.modalError.set(null);
    this.isCreateMatchModalOpen.set(true);
  }

  protected closeCreateMatchModal(): void {
    this.isCreateMatchModalOpen.set(false);
  }

  protected submitCreateMatch(): void {
    const phaseId = this.createMatchPhaseId();
    if (!phaseId) {
      this.modalError.set('A fase é obrigatória.');
      return;
    }
    const scheduledAtStr = this.createMatchScheduledAt();
    if (!scheduledAtStr) {
      this.modalError.set('A data da partida é obrigatória.');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const body = {
      group_id: this.createMatchGroupId() || undefined,
      stage: this.createMatchStage(),
      round: this.createMatchRound() || undefined,
      team_a_id: this.createMatchTeamAId() || undefined,
      team_b_id: this.createMatchTeamBId() || undefined,
      scheduled_at: new Date(scheduledAtStr).toISOString(),
    };

    this.matchesService.createMatch(phaseId, body).subscribe({
      next: () => {
        this.fetchMatches(); // Reload match list
        this.showFeedback('success', 'Partida criada com sucesso!');
        this.modalLoading.set(false);
        this.closeCreateMatchModal();
      },
      error: (err) => {
        console.error('Falha ao criar partida', err);
        this.modalError.set(err.error?.message || 'Ocorreu um erro ao criar a partida.');
        this.modalLoading.set(false);
      },
    });
  }

  protected openEditMatchModal(match: Match): void {
    this.selectedMatch.set(match);
    this.editMatchPhaseId.set(match.phase_id || '');
    this.editMatchGroupId.set(match.group_id || '');
    this.editMatchStage.set(match.stage);
    this.editMatchRound.set(match.round || '');
    this.editMatchTeamAId.set(match.team_a_id || '');
    this.editMatchTeamBId.set(match.team_b_id || '');
    // Format date-time for datetime-local input (YYYY-MM-DDThh:mm)
    if (match.scheduled_at) {
      const d = new Date(match.scheduled_at);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      this.editMatchScheduledAt.set(localISOTime);
    } else {
      this.editMatchScheduledAt.set('');
    }
    this.editMatchStatus.set(match.status);
    this.editMatchScoreA.set(match.score_a || 0);
    this.editMatchScoreB.set(match.score_b || 0);
    this.editMatchScoreAExtra.set(match.score_a_extra || 0);
    this.editMatchScoreBExtra.set(match.score_b_extra || 0);
    this.editMatchPenaltyScoreA.set(match.penalty_score_a ?? null);
    this.editMatchPenaltyScoreB.set(match.penalty_score_b ?? null);

    this.modalError.set(null);
    this.isEditMatchModalOpen.set(true);
  }

  protected closeEditMatchModal(): void {
    this.isEditMatchModalOpen.set(false);
    this.selectedMatch.set(null);
  }

  protected onScoreInput(): void {
    if (this.editMatchStatus() !== 'finished') {
      this.editMatchStatus.set('finished');
    }
  }

  protected submitEditMatch(): void {
    const match = this.selectedMatch();
    if (!match) return;

    const scheduledAtStr = this.editMatchScheduledAt();
    if (!scheduledAtStr) {
      this.modalError.set('A data da partida é obrigatória.');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const body = {
      phase_id: this.editMatchPhaseId(),
      group_id: this.editMatchGroupId() || null,
      stage: this.editMatchStage(),
      round: this.editMatchRound() || null,
      team_a_id: this.editMatchTeamAId() || null,
      team_b_id: this.editMatchTeamBId() || null,
      scheduled_at: new Date(scheduledAtStr).toISOString(),
      status: this.editMatchStatus(),
      score_a: Number(this.editMatchScoreA()),
      score_b: Number(this.editMatchScoreB()),
      score_a_extra: Number(this.editMatchScoreAExtra()),
      score_b_extra: Number(this.editMatchScoreBExtra()),
      penalty_score_a: this.editMatchPenaltyScoreA() !== null && this.editMatchPenaltyScoreA() !== undefined && String(this.editMatchPenaltyScoreA()).trim() !== '' ? Number(this.editMatchPenaltyScoreA()) : null,
      penalty_score_b: this.editMatchPenaltyScoreB() !== null && this.editMatchPenaltyScoreB() !== undefined && String(this.editMatchPenaltyScoreB()).trim() !== '' ? Number(this.editMatchPenaltyScoreB()) : null,
    };

    this.matchesService.updateMatch(match.id, body).subscribe({
      next: () => {
        this.fetchMatches(); // Reload match list
        this.showFeedback('success', 'Partida atualizada com sucesso e rankings recalculados!');
        this.modalLoading.set(false);
        this.closeEditMatchModal();
      },
      error: (err) => {
        console.error('Falha ao atualizar partida', err);
        this.modalError.set(err.error?.message || 'Ocorreu um erro ao atualizar a partida.');
        this.modalLoading.set(false);
      },
    });
  }

  protected openDeleteMatchModal(match: Match): void {
    this.selectedMatch.set(match);
    this.modalError.set(null);
    this.isDeleteMatchModalOpen.set(true);
  }

  protected closeDeleteMatchModal(): void {
    this.isDeleteMatchModalOpen.set(false);
    this.selectedMatch.set(null);
  }

  protected submitDeleteMatch(): void {
    const match = this.selectedMatch();
    if (!match) return;

    this.modalLoading.set(true);
    this.modalError.set(null);

    this.matchesService.deleteMatch(match.id).subscribe({
      next: () => {
        this.fetchMatches(); // Reload match list
        this.showFeedback('success', 'Partida excluída com sucesso e rankings atualizados!');
        this.modalLoading.set(false);
        this.closeDeleteMatchModal();
      },
      error: (err) => {
        console.error('Falha ao excluir partida', err);
        this.modalError.set(err.error?.message || 'Ocorreu um erro ao excluir a partida.');
        this.modalLoading.set(false);
      },
    });
  }
}
