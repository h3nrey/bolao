import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
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

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}
