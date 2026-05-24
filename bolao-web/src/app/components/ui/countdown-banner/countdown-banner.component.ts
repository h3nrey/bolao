import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-banner.component.html',
})
export class CountdownBannerComponent implements OnInit, OnDestroy {
  protected readonly countdownDays = signal('00');
  protected readonly countdownHours = signal('00');
  protected readonly countdownMinutes = signal('00');
  protected readonly countdownSeconds = signal('00');

  private timerIntervalId: any;

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }

  private startCountdown(): void {
    const targetDate = new Date('2026-06-11T17:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        this.countdownDays.set('00');
        this.countdownHours.set('00');
        this.countdownMinutes.set('00');
        this.countdownSeconds.set('00');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      this.countdownDays.set(days.toString().padStart(2, '0'));
      this.countdownHours.set(hours.toString().padStart(2, '0'));
      this.countdownMinutes.set(minutes.toString().padStart(2, '0'));
      this.countdownSeconds.set(seconds.toString().padStart(2, '0'));
    };

    updateTimer();
    this.timerIntervalId = setInterval(updateTimer, 1000);
  }
}
