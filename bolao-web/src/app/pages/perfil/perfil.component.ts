import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: 'avamec' | 'siscad' | 'inovaula' | 'materiais-digitais' | 'outro' | null;
  seniority?: 'bolsista' | 'clt' | 'gerente' | 'pmo' | 'outro' | null;
  created_at?: string;
  updated_at?: string;
  can_edit?: boolean;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
})
export class PerfilComponent {
  // Inputs
  user = input.required<UserProfile | null>();

  // Outputs
  logoutRequested = output<void>();

  protected getProjectLabel(project: string | null | undefined): string {
    if (!project) return 'Não definido';
    const mapping: Record<string, string> = {
      'avamec': 'AVAMEC',
      'siscad': 'SISCAD',
      'inovaula': 'Inovaula',
      'materiais-digitais': 'Materiais Digitais',
      'outro': 'Outro'
    };
    return mapping[project] || project;
  }

  protected getSeniorityLabel(seniority: string | null | undefined): string {
    if (!seniority) return 'Não definido';
    const mapping: Record<string, string> = {
      'bolsista': 'Bolsista',
      'clt': 'CLT',
      'gerente': 'Gerente',
      'pmo': 'PMO',
      'outro': 'Outro'
    };
    return mapping[seniority] || seniority;
  }

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}
