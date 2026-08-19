import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Constants } from '@core/constants';

// Tracks whether the "consider enabling 2FA" banner should be shown - set right after
// a successful login with no 2FA configured, when it isn't required (is2FaRequired:
// true has its own, separate forced-redirect flow in login.component.ts, unaffected by
// this). Dismissing persists via localStorage so it doesn't reappear every login once
// acknowledged.
@Injectable({
  providedIn: 'root'
})
export class TwoFaNudgeService {
  private readonly dismissedKey = Constants.LocalStorageKeys.twoFaBannerDismissed;

  public visible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public notifyLoginSuccess(requiresTwoFactor: boolean): void {
    const shouldShow = !requiresTwoFactor
      && !Constants.is2FaRequired
      && Constants.show2FaBanner
      && localStorage.getItem(this.dismissedKey) !== 'true';

    this.visible.next(shouldShow);
  }

  public dismiss(): void {
    localStorage.setItem(this.dismissedKey, 'true');
    this.visible.next(false);
  }
}
