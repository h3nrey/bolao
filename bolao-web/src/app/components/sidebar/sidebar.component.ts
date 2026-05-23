import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarItemComponent } from '../ui/sidebar-item/sidebar-item.component';
import { UserProfileFooterComponent } from '../ui/user-profile-footer/user-profile-footer.component';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SidebarItemComponent, UserProfileFooterComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  // Inputs
  activeTab = input.required<'leaderboard' | 'matches' | 'rules' | 'profile'>();
  user = input.required<UserProfile | null>();

  // Outputs
  tabSelected = output<'leaderboard' | 'matches' | 'rules' | 'profile'>();
  logoutRequested = output<void>();

  protected selectTab(tab: 'leaderboard' | 'matches' | 'rules' | 'profile'): void {
    this.tabSelected.emit(tab);
  }

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}
