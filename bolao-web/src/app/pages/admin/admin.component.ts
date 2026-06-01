import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { API_BASE_URL } from '../../config/api.constants';
import { FormSelectComponent, SelectOption } from '../../components/ui/form-select/form-select.component';
import { ModalComponent } from '../../components/ui/modal/modal.component';
import { ConfirmDeleteModalComponent } from '../../components/ui/confirm-delete-modal/confirm-delete-modal.component';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormSelectComponent,
    ModalComponent,
    ConfirmDeleteModalComponent,
    LucideSearch,
    LucideEdit2,
    LucideTrash2,
    LucideShield,
    LucideX,
    LucideCheck,
    LucideInfo,
  ],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly apiBaseUrl = API_BASE_URL;

  // State Signals
  protected readonly users = signal<UserProfile[]>([]);
  protected readonly loading = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter Signals
  protected readonly searchQuery = signal('');
  protected readonly projectFilter = signal<string>('all');
  protected readonly roleFilter = signal<string>('all');

  // Modal Signals
  protected readonly isEditModalOpen = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly modalLoading = signal(false);
  protected readonly modalError = signal<string | null>(null);

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

  ngOnInit(): void {
    // Front-end Guard: Check admin authorization status
    const me = this.session.user();
    if (!me || !me.is_admin) {
      this.router.navigate(['/ranking']);
      return;
    }

    this.fetchUsers();
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
}
