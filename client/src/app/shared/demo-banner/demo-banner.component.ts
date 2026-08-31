import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { AppInfoService } from '@core/services/app-info.service';

// Mounted once, globally, alongside the sidenav - see AppInfoService for why it's hidden by default.
@Component({
  selector: 'app-demo-banner',
  templateUrl: './demo-banner.component.html',
  styleUrls: ['./demo-banner.component.scss'],
  imports: [AsyncPipe]
})
export class DemoBannerComponent {
  private readonly appInfoService = inject(AppInfoService);

  appInfo$ = this.appInfoService.get();
}
