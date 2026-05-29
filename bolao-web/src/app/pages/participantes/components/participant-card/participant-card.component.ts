import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RankingUser {
  position: number;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  user_project?: string | null;
  user_seniority?: string | null;
  pts_total: number;
  pts_matches: number;
}

@Component({
  selector: 'app-participant-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participant-card.component.html',
})
export class ParticipantCardComponent {
  user = input.required<RankingUser>();
  cardClick = output<void>();

  protected getSeniorityLabel(seniority: string | null | undefined): string {
    if (!seniority) return 'Participante';
    const mapping: Record<string, string> = {
      'bolsista': 'Bolsista',
      'clt': 'CLT',
      'gerente': 'Gerente',
      'pmo': 'PMO',
      'outro': 'Outro'
    };
    return mapping[seniority] || seniority;
  }

  protected onClick(event: Event): void {
    event.preventDefault();
    this.cardClick.emit();
  }
}
