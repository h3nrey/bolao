import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-score-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './score-input.component.html',
})
export class ScoreInputComponent {
  value = input.required<number | null>();
  disabled = input<boolean>(false);

  valueChange = output<number | null>();
  inputChange = output<void>();
  blur = output<void>();

  onModelChange(newVal: any): void {
    const numericVal = newVal === null || newVal === undefined || newVal === '' ? null : Number(newVal);
    this.valueChange.emit(numericVal);
    this.inputChange.emit();
  }
}
