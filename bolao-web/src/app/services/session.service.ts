import { Injectable, signal, computed } from '@angular/core';
import {
  ProjectValue,
  SeniorityValue,
} from '../shared/constants/profile-options';

interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatar_url?: string | null;
  project?: ProjectValue | null;
  seniority?: SeniorityValue | null;
  created_at?: string;
  updated_at?: string;
  can_edit?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  token = signal<string>('');
  user = signal<UserProfile | null>(null);
  
  // Custom signal to track profile views dynamically
  profileViewUser = signal<UserProfile | null>(null);

  isProfileIncomplete = computed(() => {
    const u = this.user();
    return !!u && (!u.project || !u.seniority || !u.name);
  });

  logout(): void {
    localStorage.removeItem('bolao_token');
    this.token.set('');
    this.user.set(null);
    this.profileViewUser.set(null);
  }
}
