import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch.component.html',
  host: {
    class: 'shrink-0 block'
  }
})
export class SwitchComponent {
  checked = input<boolean>(false);
  disabled = input<boolean>(false);
  activeLabel = input<string>('Abertos');
  inactiveLabel = input<string>('Fechados');
  showLabel = input<boolean>(true);
  color = input<'success' | 'primary' | 'info'>('success');

  checkedChange = output<boolean>();

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.checkedChange.emit(!this.checked());
  }
}
