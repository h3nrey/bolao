import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-item.component.html',
})
export class SidebarItemComponent {
  active = input.required<boolean>();
  label = input.required<string>();
}
