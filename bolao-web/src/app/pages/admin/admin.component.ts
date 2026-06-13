import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { API_BASE_URL } from '../../config/api.constants';
import { FormSelectComponent, SelectOption } from '../../components/ui/form-select/form-select.component';
import { ModalComponent } from '../../components/ui/modal/modal.component';
import { ConfirmDeleteModalComponent } from '../../components/ui/confirm-delete-modal/confirm-delete-modal.component';
import { TabSelectorComponent, TabOption } from '../../components/ui/tab-selector/tab-selector.component';
import { SelectedSelectorComponent, SelectorItem } from '../../components/ui/selected-selector/selected-selector.component';
import { PartidasComponent } from './partidas/partidas.component';
import {
  PROJECT_LABELS,
  PROJECT_VALUES,
  ProjectValue,
  SENIORITY_LABELS,
  SENIORITY_VALUES,
  SeniorityValue,
} from '../../shared/constants/profile-options';
import {
  LucideSearch,
  LucideEdit2,
  LucideTrash2,
  LucideShield,
  LucideCheck,
  LucideX,
  LucideInfo,
} from '@lucide/angular';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: ProjectValue | null;
  seniority?: SeniorityValue | null;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

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
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormSelectComponent,
    ModalComponent,
    ConfirmDeleteModalComponent,
    TabSelectorComponent,
    SelectedSelectorComponent,
    LucideSearch,
    LucideEdit2,
    LucideTrash2,
    LucideShield,
    LucideX,
    LucideCheck,
    LucideInfo,
    PartidasComponent,
  ],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly apiBaseUrl = API_BASE_URL;

  // Tab State
  protected readonly activeTab = signal<'membros' | 'times' | 'partidas'>('membros');
  protected readonly tabOptions: TabOption[] = [
    { id: 'membros', label: 'Membros' },
    { id: 'times', label: 'Times' },
    { id: 'partidas', label: 'Partidas' },
  ];

  // State Signals
  protected readonly users = signal<UserProfile[]>([]);
  protected readonly loading = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Teams State Signals
  protected readonly teamsList = signal<Team[]>([]);
  protected readonly selectedTeamIds = signal<Set<string>>(new Set());

  // Search & Filter Signals
  protected readonly searchQuery = signal('');
  protected readonly projectFilter = signal<string>('all');
  protected readonly roleFilter = signal<string>('all');

  // Modal Signals
  protected readonly isEditModalOpen = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly modalLoading = signal(false);
  protected readonly modalError = signal<string | null>(null);

  // Modal Signals for Teams
  protected readonly isCreateTeamModalOpen = signal(false);
  protected readonly isEditTeamModalOpen = signal(false);
  protected readonly isDeleteTeamModalOpen = signal(false);
  protected readonly isBulkDelete = signal(false);

  // Form Signals for Teams
  protected readonly createTeamName = signal('');
  protected readonly createTeamEmoji = signal('');
  protected readonly createTeamUrl = signal('');
  protected readonly createTeamExternalId = signal('');

  protected readonly editTeamName = signal('');
  protected readonly editTeamEmoji = signal('');
  protected readonly editTeamUrl = signal('');
  protected readonly editTeamExternalId = signal('');
  protected readonly selectedTeam = signal<Team | null>(null);

  // Selected User for actions
  protected readonly selectedUser = signal<UserProfile | null>(null);

  // Form Signals for Editing
  protected readonly editName = signal('');
  protected readonly editProject = signal<string>('');
  protected readonly editSeniority = signal<string>('');
  protected readonly editIsAdmin = signal(false);

  // Options for Dropdowns
  protected readonly projectOptions: SelectOption[] = [
    { value: '', label: 'Sem Projeto / Não Informado' },
    ...PROJECT_VALUES.map((val) => ({ value: val, label: PROJECT_LABELS[val] })),
  ];

  protected readonly seniorityOptions: SelectOption[] = [
    { value: '', label: 'Sem Senioridade / Outro' },
    ...SENIORITY_VALUES.map((val) => ({ value: val, label: SENIORITY_LABELS[val] })),
  ];

  // Options for filter bars
  protected readonly filterProjectOptions = [
    { id: 'all', label: 'Todos os Projetos' },
    { id: 'none', label: 'Sem Projeto' },
    ...PROJECT_VALUES.map((val) => ({ id: val, label: PROJECT_LABELS[val] })),
  ];

  protected readonly filterRoleOptions = [
    { id: 'all', label: 'Todos os Papéis' },
    { id: 'admin', label: 'Apenas Admins' },
    { id: 'user', label: 'Apenas Participantes' },
  ];

  // Calculated Stats
  protected readonly stats = computed(() => {
    const list = this.users();
    const total = list.length;
    const admins = list.filter((u) => u.is_admin).length;
    const completed = list.filter((u) => u.name && u.project && u.seniority).length;
    const incomplete = total - completed;

    return { total, admins, completed, incomplete };
  });

  // Dynamically Filtered Users List
  protected readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const project = this.projectFilter();
    const role = this.roleFilter();
    let list = this.users();

    // 1. Search Query
    if (query) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
    }

    // 2. Project Filter
    if (project !== 'all') {
      if (project === 'none') {
        list = list.filter((u) => !u.project);
      } else {
        list = list.filter((u) => u.project === project);
      }
    }

    // 3. Role Filter
    if (role !== 'all') {
      if (role === 'admin') {
        list = list.filter((u) => u.is_admin);
      } else {
        list = list.filter((u) => !u.is_admin);
      }
    }

    return list;
  });

  // Dynamically Filtered Teams List
  protected readonly filteredTeams = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    let list = this.teamsList();

    if (query) {
      list = list.filter((t) => t.name.toLowerCase().includes(query));
    }

    return list;
  });



  // Selected teams info mapped for the SelectedSelectorComponent
  protected readonly selectedTeamsInfo = computed<SelectorItem[]>(() => {
    const ids = this.selectedTeamIds();
    const list = this.teamsList();
    return list
      .filter((t) => ids.has(t.id))
      .map((t) => ({
        id: t.id,
        label: t.name,
        emoji: t.flag_emoji,
      }));
  });

  ngOnInit(): void {
    // Front-end Guard: Check admin authorization status
    const me = this.session.user();
    if (!me || !me.is_admin) {
      this.router.navigate(['/ranking']);
      return;
    }

    this.fetchUsers();
    this.fetchTeams();
  }

  protected fetchUsers(): void {
    this.loading.set(true);
    this.apiError.set(null);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);

    this.http.get<UserProfile[]>(`${this.apiBaseUrl}/users`, { headers }).subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar usuários', err);
        this.apiError.set('Falha ao carregar usuários. Certifique-se de que possui privilégios de administrador.');
        this.loading.set(false);
      },
    });
  }

  // Edit Action
  protected openEditModal(user: UserProfile): void {
    this.selectedUser.set(user);
    this.editName.set(user.name);
    this.editProject.set(user.project || '');
    this.editSeniority.set(user.seniority || '');
    this.editIsAdmin.set(user.is_admin || false);
    this.modalError.set(null);
    this.isEditModalOpen.set(true);
  }

  protected closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedUser.set(null);
  }

  protected submitEdit(): void {
    const user = this.selectedUser();
    if (!user) return;

    const name = this.editName().trim();
    if (!name) {
      this.modalError.set('O nome do usuário é obrigatório.');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    const body = {
      name,
      project: this.editProject() || null,
      seniority: this.editSeniority() || null,
      is_admin: this.editIsAdmin(),
    };

    this.http.patch<UserProfile>(`${this.apiBaseUrl}/users/${user.id}`, body, { headers }).subscribe({
      next: (updated) => {
        // Update local list state
        this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        
        // If current user edited themselves, update the session service
        if (user.id === this.session.user()?.id) {
          const currentMe = this.session.user();
          if (currentMe) {
            this.session.user.set({
              ...currentMe,
              name: updated.name,
              project: updated.project,
              seniority: updated.seniority,
              is_admin: updated.is_admin,
            });
          }
        }

        this.showFeedback('success', `Usuário "${updated.name}" atualizado com sucesso!`);
        this.modalLoading.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Falha ao atualizar usuário', err);
        this.modalError.set('Ocorreu um erro ao salvar as alterações do usuário.');
        this.modalLoading.set(false);
      },
    });
  }

  // Delete Action
  protected openDeleteModal(user: UserProfile): void {
    this.selectedUser.set(user);
    this.modalError.set(null);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedUser.set(null);
  }

  protected submitDelete(): void {
    const user = this.selectedUser();
    if (!user) return;

    // Prevent deleting yourself
    if (user.id === this.session.user()?.id) {
      this.modalError.set('Você não pode remover a si mesmo da plataforma.');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);

    this.http.delete(`${this.apiBaseUrl}/users/${user.id}`, { headers }).subscribe({
      next: () => {
        // Remove locally from state
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.showFeedback('success', `Usuário "${user.name}" removido com sucesso.`);
        this.modalLoading.set(false);
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Falha ao remover usuário', err);
        this.modalError.set('Ocorreu um erro ao remover o usuário do banco de dados.');
        this.modalLoading.set(false);
      },
    });
  }

  // Display success/error alerts
  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4500);
  }

  // Utility labels maps
  protected getProjectLabel(slug: string | null | undefined): string {
    if (!slug) return 'Sem Projeto';
    return PROJECT_LABELS[slug as ProjectValue] || slug;
  }

  protected getSeniorityLabel(slug: string | null | undefined): string {
    if (!slug) return 'Sem Senioridade';
    return SENIORITY_LABELS[slug as SeniorityValue] || slug;
  }

  // Tab selection callback
  protected onTabChange(tabId: string): void {
    this.activeTab.set(tabId as 'membros' | 'times' | 'partidas');
    this.searchQuery.set('');
    this.selectedTeamIds.set(new Set());
  }

  protected fetchTeams(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.http.get<Team[]>(`${this.apiBaseUrl}/teams`).subscribe({
      next: (data) => {
        this.teamsList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar seleções', err);
        this.apiError.set('Falha ao carregar seleções.');
        this.loading.set(false);
      },
    });
  }

  // Checkbox Selection Logic
  protected lastClickedIndex: number | null = null;

  protected onTeamCheckboxClick(event: MouseEvent, team: Team, index: number): void {
    const list = this.filteredTeams();
    const isChecked = !this.isTeamSelected(team.id);

    if (event.shiftKey && this.lastClickedIndex !== null) {
      const start = Math.min(this.lastClickedIndex, index);
      const end = Math.max(this.lastClickedIndex, index);
      
      this.selectedTeamIds.update((set) => {
        const next = new Set(set);
        for (let i = start; i <= end; i++) {
          const tId = list[i].id;
          if (isChecked) {
            next.add(tId);
          } else {
            next.delete(tId);
          }
        }
        return next;
      });
    } else {
      this.toggleTeamSelection(team.id);
    }
    this.lastClickedIndex = index;
  }

  protected toggleTeamSelection(id: string): void {
    this.selectedTeamIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected isTeamSelected(id: string): boolean {
    return this.selectedTeamIds().has(id);
  }

  protected isAllTeamsSelected(): boolean {
    const list = this.filteredTeams();
    if (list.length === 0) return false;
    return list.every((t) => this.selectedTeamIds().has(t.id));
  }

  protected toggleAllTeams(): void {
    const list = this.filteredTeams();
    const allSelected = this.isAllTeamsSelected();
    
    this.selectedTeamIds.update((set) => {
      const next = new Set(set);
      if (allSelected) {
        list.forEach((t) => next.delete(t.id));
      } else {
        list.forEach((t) => next.add(t.id));
      }
      return next;
    });
  }

  // Create Team Methods
  protected openCreateTeamModal(): void {
    this.createTeamName.set('');
    this.createTeamEmoji.set('');
    this.createTeamUrl.set('');
    this.createTeamExternalId.set('');
    this.modalError.set(null);
    this.isCreateTeamModalOpen.set(true);
  }

  protected closeCreateTeamModal(): void {
    this.isCreateTeamModalOpen.set(false);
  }

  protected submitCreateTeam(): void {
    const name = this.createTeamName().trim();
    if (!name) {
      this.modalError.set('O nome do time é obrigatório.');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const body = {
      name,
      flag_emoji: this.createTeamEmoji().trim() || null,
      flag_url: this.createTeamUrl().trim() || null,
      external_id: this.createTeamExternalId().trim() || null,
    };

    this.http.post<Team>(`${this.apiBaseUrl}/teams`, body).subscribe({
      next: (created) => {
        this.teamsList.update((list) => [...list, created]);
        this.showFeedback('success', `Time "${created.name}" criado com sucesso!`);
        this.modalLoading.set(false);
        this.closeCreateTeamModal();
      },
      error: (err) => {
        console.error('Falha ao criar time', err);
        this.modalError.set(err.error?.message || 'Ocorreu um erro ao criar o time.');
        this.modalLoading.set(false);
      },
    });
  }

  // Edit Team Methods
  protected openEditTeamModal(team: Team): void {
    this.selectedTeam.set(team);
    this.editTeamName.set(team.name);
    this.editTeamEmoji.set(team.flag_emoji || '');
    this.editTeamUrl.set(team.flag_url || '');
    this.editTeamExternalId.set(team.external_id || '');
    this.modalError.set(null);
    this.isEditTeamModalOpen.set(true);
  }

  protected closeEditTeamModal(): void {
    this.isEditTeamModalOpen.set(false);
    this.selectedTeam.set(null);
  }

  protected submitEditTeam(): void {
    const team = this.selectedTeam();
    if (!team) return;

    const name = this.editTeamName().trim();
    if (!name) {
      this.modalError.set('O nome do time é obrigatório.');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const body = {
      name,
      flag_emoji: this.editTeamEmoji().trim() || null,
      flag_url: this.editTeamUrl().trim() || null,
      external_id: this.editTeamExternalId().trim() || null,
    };

    this.http.patch<Team>(`${this.apiBaseUrl}/teams/${team.id}`, body).subscribe({
      next: (updated) => {
        this.teamsList.update((list) => list.map((t) => (t.id === team.id ? updated : t)));
        this.showFeedback('success', `Time "${updated.name}" atualizado com sucesso!`);
        this.modalLoading.set(false);
        this.closeEditTeamModal();
      },
      error: (err) => {
        console.error('Falha ao atualizar time', err);
        this.modalError.set(err.error?.message || 'Ocorreu um erro ao atualizar o time.');
        this.modalLoading.set(false);
      },
    });
  }

  // Delete Team Methods
  protected openDeleteTeamModal(team: Team): void {
    this.selectedTeam.set(team);
    this.isBulkDelete.set(false);
    this.modalError.set(null);
    this.isDeleteTeamModalOpen.set(true);
  }

  protected openBulkDeleteModal(): void {
    this.isBulkDelete.set(true);
    this.modalError.set(null);
    this.isDeleteTeamModalOpen.set(true);
  }

  protected closeDeleteTeamModal(): void {
    this.isDeleteTeamModalOpen.set(false);
    this.selectedTeam.set(null);
  }

  protected submitDeleteTeams(): void {
    this.modalLoading.set(true);
    this.modalError.set(null);

    const idsToDelete = this.isBulkDelete()
      ? Array.from(this.selectedTeamIds())
      : [this.selectedTeam()!.id];

    this.http.delete(`${this.apiBaseUrl}/teams`, { body: { ids: idsToDelete } }).subscribe({
      next: () => {
        this.teamsList.update((list) => list.filter((t) => !idsToDelete.includes(t.id)));
        this.selectedTeamIds.update((set) => {
          const next = new Set(set);
          idsToDelete.forEach((id) => next.delete(id));
          return next;
        });
        
        const message = idsToDelete.length === 1
          ? 'Time removido com sucesso (limpeza em cascata concluída).'
          : `${idsToDelete.length} times removidos com sucesso (limpeza em cascata concluída).`;
          
        this.showFeedback('success', message);
        this.modalLoading.set(false);
        this.closeDeleteTeamModal();
      },
      error: (err) => {
        console.error('Falha ao remover times', err);
        this.modalError.set(err.error?.message || 'Ocorreu um erro ao remover os times do banco de dados.');
        this.modalLoading.set(false);
      },
    });
  }

  protected clearTeamSelection(): void {
    this.selectedTeamIds.set(new Set());
  }

  protected removeTeamFromSelection(id: string): void {
    this.selectedTeamIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

}

