import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { FormSelectComponent } from '../form-select/form-select.component';
import {
  PROJECT_OPTIONS,
  ProjectValue,
  SENIORITY_OPTIONS,
  SeniorityValue,
} from '../../../shared/constants/profile-options';

@Component({
  selector: 'app-profile-completion-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, FormSelectComponent],
  templateUrl: './profile-completion-modal.component.html',
})
export class ProfileCompletionModalComponent {
  open = input.required<boolean>();
  loading = input<boolean>(false);
  error = input<string | null>(null);
  name = input<string>('');
  project = input<ProjectValue | ''>('');
  seniority = input<SeniorityValue | ''>('');

  save = output<void>();
  logout = output<void>();
  nameChange = output<string>();
  projectChange = output<ProjectValue>();
  seniorityChange = output<SeniorityValue>();

  readonly projectOptions = PROJECT_OPTIONS;
  readonly seniorityOptions = SENIORITY_OPTIONS;

  handleNameInput(event: Event): void {
    this.nameChange.emit((event.target as HTMLInputElement).value);
  }

  onProjectChange(value: string): void {
    this.projectChange.emit(value as ProjectValue);
  }

  onSeniorityChange(value: string): void {
    this.seniorityChange.emit(value as SeniorityValue);
  }
}
