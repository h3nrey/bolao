import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarItemComponent } from '../ui/sidebar-item/sidebar-item.component';
import { UserProfileFooterComponent } from '../ui/user-profile-footer/user-profile-footer.component';
import { LogoComponent } from '../ui/logo/logo.component';

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
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SidebarItemComponent, UserProfileFooterComponent, LogoComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  // Inputs
  activeTab = input.required<'leaderboard' | 'matches' | 'betsheet' | 'rules' | 'profile' | 'participants'>();
  user = input.required<UserProfile | null>();

  // Outputs
  tabSelected = output<'leaderboard' | 'matches' | 'betsheet' | 'rules' | 'profile' | 'participants'>();
  logoutRequested = output<void>();

  protected selectTab(tab: 'leaderboard' | 'matches' | 'betsheet' | 'rules' | 'profile' | 'participants'): void {
    this.tabSelected.emit(tab);
  }

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}
