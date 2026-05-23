import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 w-full" [style.padding-top]="paddingY()" [style.padding-bottom]="paddingY()">
      <div
        class="rounded-full animate-spin"
        [class.w-7]="size() === 'sm'" [class.h-7]="size() === 'sm'"
        [class.w-10]="size() === 'md'" [class.h-10]="size() === 'md'"
        [class.w-12]="size() === 'lg'" [class.h-12]="size() === 'lg'"
        style="border: 2.5px solid rgba(255,255,255,0.06); border-top-color: rgb(239,68,68);"
      ></div>
      @if (message()) {
        <p class="text-xs text-slate-400 select-none">{{ message() }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  message = input<string>('');
  size = input<'sm' | 'md' | 'lg'>('md');
  paddingY = input<string>('5rem');
}
