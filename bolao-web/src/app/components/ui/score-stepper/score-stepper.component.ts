import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center gap-2 select-none">
      <!-- Team label -->
      @if (label()) {
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center truncate max-w-full">
          {{ flagEmoji() }} {{ label() }}
        </span>
      }

      <!-- Stepper control -->
      <div
        class="flex items-center gap-0 rounded-2xl overflow-hidden border transition-all duration-200"
        [class.border-white/10]="!disabled()"
        [class.border-white/5]="disabled()"
        [class.opacity-50]="disabled()"
        style="background: rgba(10,14,24,0.8)"
      >
        <!-- Decrement button -->
        <button
          type="button"
          (click)="decrement()"
          [disabled]="disabled() || value() <= 0"
          class="w-10 h-12 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 border-none outline-none"
          style="background: transparent;"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M5 12h14"/>
          </svg>
        </button>

        <!-- Value display -->
        <div class="flex items-center justify-center min-w-[48px] h-12 px-2 border-x border-white/8">
          <span
            class="text-2xl font-black text-white tabular-nums transition-all duration-100"
            [class.text-red-400]="value() > 0"
            [class.text-slate-500]="value() === 0"
          >{{ value() }}</span>
        </div>

        <!-- Increment button -->
        <button
          type="button"
          (click)="increment()"
          [disabled]="disabled()"
          class="w-10 h-12 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 border-none outline-none"
          style="background: transparent;"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class ScoreStepperComponent {
  value = input.required<number>();
  label = input<string>('');
  flagEmoji = input<string>('');
  disabled = input<boolean>(false);

  valueChange = output<number>();

  increment(): void {
    if (!this.disabled()) {
      this.valueChange.emit(this.value() + 1);
    }
  }

  decrement(): void {
    if (!this.disabled() && this.value() > 0) {
      this.valueChange.emit(this.value() - 1);
    }
  }
}
