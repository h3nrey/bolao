import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rule-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative bg-bg-card rounded-xl p-5 transition-all duration-300 flex justify-between items-start gap-4 h-full shadow-sm hover:shadow-md">
      <div class="flex flex-col gap-3 flex-1 text-left">
        <div class="flex items-center gap-2.5">
          <h3 class="font-black text-white text-xs md:text-sm uppercase font-ui tracking-wider">{{ title }}</h3>
        </div>
        <p class="text-xs text-[#9B9BAD] leading-relaxed" [innerHTML]="description"></p>
      </div>
      
      <div class="flex flex-col items-center justify-center px-4 py-2 bg-bg-sidebar rounded-lg min-w-[76px] self-stretch select-none">
        <span class="text-3xl md:text-4xl font-extrabold text-brand-red-light font-body tracking-tight leading-none">{{ points }}</span>
        <span class="text-[9px] font-bold text-[#9B9BAD] uppercase tracking-wider mt-1">
          {{ points === 1 ? 'ponto' : 'pontos' }}
        </span>
      </div>
    </div>
  `
})
export class RuleCardComponent {
  @Input() title!: string;
  @Input() points!: number;
  @Input() description!: string;
}

@Component({
  selector: 'app-regras',
  standalone: true,
  imports: [CommonModule, RuleCardComponent],
  templateUrl: './regras.component.html',
})
export class RegrasComponent { }

