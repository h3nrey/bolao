import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  // Inputs from parent shell
  loading = input<boolean>(false);
  error = input<string | null>(null);
  initialToken = input<string>('');

  // Outputs to parent shell
  tokenConnected = output<string>();
  redirectToGoogleRequested = output<void>();

  // Internal state
  protected readonly token = signal('');

  constructor() {
    // Sync internal token signal when initialToken input changes
    // Or we can let the parent set it
  }

  ngOnInit() {
    this.token.set(this.initialToken());
  }

  protected onGoogleLogin(): void {
    this.redirectToGoogleRequested.emit();
  }

  protected onConnectToken(): void {
    const rawToken = this.token().trim();
    if (rawToken) {
      this.tokenConnected.emit(rawToken);
    }
  }
}
