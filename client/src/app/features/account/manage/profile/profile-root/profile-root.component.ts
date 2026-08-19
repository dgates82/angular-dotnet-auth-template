import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ProfilePersonalInfoComponent } from '../profile-personal-info/profile-personal-info.component';
import { ProfileSecurityInfoComponent } from '../profile-security-info/profile-security-info.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';

@Component({
    selector: 'app-profile-root',
    templateUrl: './profile-root.component.html',
    styleUrls: ['./profile-root.component.scss'],
    imports: [MatTabGroup, MatTab, MatTabLabel, FaIconComponent, ProfilePersonalInfoComponent, ProfileSecurityInfoComponent]
})
export class ProfileRootComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);


  icons = {
    personal: faUser,
    security: faLock

  }

  // Fetched once here and passed down via @Input() through the personal-info
  // and security-info tabs (and from there to TwoFaRootComponent), instead of
  // each independently calling getUserByEmail() for the same logged-in user.
  user: IApplicationUser | null = null;
  loadError = false;

  // Set via ?startTwoFa=true on the 2FA nudge banner's deep link into this page.
  selectedTabIndex = 0;
  autoStartTwoFa = false;

  ngOnInit(): void {
    this.logger.debug(`profile-root.component.ngOnInit`);

    if (this.route.snapshot.queryParamMap.get('startTwoFa')) {
      this.selectedTabIndex = 1;
      this.autoStartTwoFa = true;
    }

    const authUser = this.accountService.getLoggedInUser();
    this.accountService.getUserByEmail(authUser?.email ?? '').then(response => {
      this.user = response;
    }).catch(err => {
      this.logger.error(`profile-root.component.ngOnInit | Failed to load user:`, err);
      this.loadError = true;
    });
  }

}
