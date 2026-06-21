import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarItemComponent } from '../ui/sidebar-item/sidebar-item.component';
import { UserProfileFooterComponent } from '../ui/user-profile-footer/user-profile-footer.component';
import { LogoComponent } from '../ui/logo/logo.component';
import { LucideTrophy, LucideUsers, LucideCalendar, LucideFileText, LucideShield, LucideAward, LucidePlus } from '@lucide/angular';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: string | null;
  seniority?: string | null;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarItemComponent, 
    UserProfileFooterComponent, 
    LogoComponent,
    LucideTrophy, 
    LucideUsers, 
    LucideCalendar, 
    LucideFileText,
    LucideShield,
    LucideAward,
    LucidePlus
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly router = inject(Router);

  // Inputs
  user = input.required<UserProfile | null>();

  // Outputs
  logoutRequested = output<void>();
  quickBetRequested = output<void>();

  protected navigate(path: string): void {
    this.router.navigate([path]);
  }

  protected isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}
