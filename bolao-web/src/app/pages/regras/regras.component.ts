import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideTarget, LucideTrophy, LucideUser, LucideShield } from '@lucide/angular';

@Component({
  selector: 'app-regras',
  standalone: true,
  imports: [CommonModule, LucideTarget, LucideTrophy, LucideUser, LucideShield],
  templateUrl: './regras.component.html',
})
export class RegrasComponent { }
