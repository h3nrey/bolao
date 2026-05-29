import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideLogOut } from '@lucide/angular';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: string | null;
  seniority?: string | null;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-user-profile-footer',
  standalone: true,
  imports: [CommonModule, LucideLogOut],
  templateUrl: './user-profile-footer.component.html',
})
export class UserProfileFooterComponent {
  user = input.required<UserProfile | null>();
  logoutRequested = output<void>();
  profileRequested = output<void>();

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}
