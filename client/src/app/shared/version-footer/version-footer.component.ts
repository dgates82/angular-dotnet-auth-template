import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { AppInfoService } from '@core/services/app-info.service';

// Mounted once, globally, alongside the sidenav - renders nothing when version is empty (see AppInfoService).
@Component({
  selector: 'app-version-footer',
  templateUrl: './version-footer.component.html',
  styleUrls: ['./version-footer.component.scss'],
  imports: [AsyncPipe]
})
export class VersionFooterComponent {
  private readonly appInfoService = inject(AppInfoService);

  appInfo$ = this.appInfoService.get();
}
