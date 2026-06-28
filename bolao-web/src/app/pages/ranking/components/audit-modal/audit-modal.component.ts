import { Component, input, output, signal, computed, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../../../config/api.constants';
import { ModalComponent } from '../../../../components/ui/modal/modal.component';
import { AuditCellComponent } from '../audit-cell/audit-cell.component';
import { SessionService } from '../../../../services/session.service';

export interface AuditMatch {
  id: string;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  status: string;
  scheduled_at: string;
}

export interface AuditUser {
  id: string;
  name: string;
  pts_total: number;
  predictions: Record<
    string,
    {
      score_a: number | null;
      score_b: number | null;
      points: number;
    }
  >;
}

export interface AuditData {
  matches: AuditMatch[];
  users: AuditUser[];
}

@Component({
  selector: 'app-audit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, AuditCellComponent],
  templateUrl: './audit-modal.component.html',
})
export class AuditModalComponent {
  @ViewChild('headerContainer') headerContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('bodyContainer') bodyContainer?: ElementRef<HTMLDivElement>;

  private scrollingHeader = false;
  private scrollingBody = false;

  protected onHeaderScroll(event: Event): void {
    if (this.scrollingBody) {
      this.scrollingBody = false;
      return;
    }
    this.scrollingHeader = true;
    const header = event.target as HTMLElement;
    if (this.bodyContainer) {
      this.bodyContainer.nativeElement.scrollLeft = header.scrollLeft;
    }
  }

  protected onBodyScroll(event: Event): void {
    if (this.scrollingHeader) {
      this.scrollingHeader = false;
      return;
    }
    this.scrollingBody = true;
    const body = event.target as HTMLElement;
    if (this.headerContainer) {
      this.headerContainer.nativeElement.scrollLeft = body.scrollLeft;
    }
  }
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = API_BASE_URL;
  private readonly session = inject(SessionService);

  open = input.required<boolean>();
  tournamentId = input.required<string | null>();
  userId = input.required<string | undefined>();
  close = output<void>();

  // State
  protected readonly loadingAudit = signal(false);
  protected readonly auditData = signal<AuditData | null>(null);
  protected readonly searchFilter = signal('');
  protected readonly expandedUserId = signal<string | null>(null);

  // Computed for audit users filtering
  protected readonly filteredUsers = computed(() => {
    const data = this.auditData();
    if (!data) return [];
    const term = this.searchFilter().toLowerCase().trim();
    if (!term) return data.users;
    return data.users.filter((u) => u.name.toLowerCase().includes(term));
  });

  constructor() {
    // Automatically fetch audit data when the modal is opened
    effect(() => {
      const isOpen = this.open();
      const id = this.tournamentId();
      if (isOpen && id) {
        this.fetchAuditData(id);
      }
    });
  }

  protected closeAudit(): void {
    this.close.emit();
  }

  protected toggleUser(userId: string): void {
    this.expandedUserId.update((id) => (id === userId ? null : userId));
  }

  protected updateSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchFilter.set(val);
  }

  private fetchAuditData(tournamentId: string): void {
    this.loadingAudit.set(true);
    const token = this.session.token();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<AuditData>(`${this.apiBaseUrl}/tournaments/${tournamentId}/audit`, { headers }).subscribe({
      next: (data) => {
        this.auditData.set(data);
        this.loadingAudit.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar dados de auditoria', err);
        this.loadingAudit.set(false);
      },
    });
  }
}
