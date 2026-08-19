import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

import { TwoFaNudgeService } from '@core/services/two-fa-nudge.service';

// Mounted once, globally, alongside the sidenav - shows itself only when
// TwoFaNudgeService says to (right after a login where 2FA isn't required and isn't
// configured), and stays dismissed across the session once closed.
@Component({
  selector: 'app-two-fa-nudge-banner',
  templateUrl: './two-fa-nudge-banner.component.html',
  styleUrls: ['./two-fa-nudge-banner.component.scss'],
  imports: [AsyncPipe, RouterLink, MatIconButton, MatIcon]
})
export class TwoFaNudgeBannerComponent {
  private readonly twoFaNudgeService = inject(TwoFaNudgeService);

  visible$ = this.twoFaNudgeService.visible;

  dismiss(): void {
    this.twoFaNudgeService.dismiss();
  }
}
