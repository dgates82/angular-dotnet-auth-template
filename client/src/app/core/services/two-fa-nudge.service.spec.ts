import { TestBed } from '@angular/core/testing';

import { TwoFaNudgeService } from './two-fa-nudge.service';
import { Constants } from '@core/constants';

describe('TwoFaNudgeService', () => {
  let service: TwoFaNudgeService;
  let originalIs2FaRequired: boolean;
  let originalShow2FaBanner: boolean;

  beforeEach(() => {
    originalIs2FaRequired = Constants.is2FaRequired;
    originalShow2FaBanner = Constants.show2FaBanner;
    localStorage.removeItem(Constants.LocalStorageKeys.twoFaBannerDismissed);

    TestBed.configureTestingModule({});
    service = TestBed.inject(TwoFaNudgeService);
  });

  afterEach(() => {
    Constants.is2FaRequired = originalIs2FaRequired;
    Constants.show2FaBanner = originalShow2FaBanner;
    localStorage.removeItem(Constants.LocalStorageKeys.twoFaBannerDismissed);
  });

  it('starts hidden', () => {
    expect(service.visible.value).toBe(false);
  });

  it('shows the banner after a login with no 2FA required and none configured', () => {
    Constants.is2FaRequired = false;
    Constants.show2FaBanner = true;

    service.notifyLoginSuccess(false);

    expect(service.visible.value).toBe(true);
  });

  it('does not show the banner when the account already has 2FA configured', () => {
    Constants.is2FaRequired = false;
    Constants.show2FaBanner = true;

    service.notifyLoginSuccess(true);

    expect(service.visible.value).toBe(false);
  });

  it('does not show the banner when 2FA is required (that has its own forced-setup flow)', () => {
    Constants.is2FaRequired = true;
    Constants.show2FaBanner = true;

    service.notifyLoginSuccess(false);

    expect(service.visible.value).toBe(false);
  });

  it('does not show the banner when show2FaBanner is disabled', () => {
    Constants.is2FaRequired = false;
    Constants.show2FaBanner = false;

    service.notifyLoginSuccess(false);

    expect(service.visible.value).toBe(false);
  });

  it('does not show the banner again after being dismissed, even on a later login', () => {
    Constants.is2FaRequired = false;
    Constants.show2FaBanner = true;

    service.notifyLoginSuccess(false);
    expect(service.visible.value).toBe(true);

    service.dismiss();
    expect(service.visible.value).toBe(false);

    service.notifyLoginSuccess(false);
    expect(service.visible.value).toBe(false);
  });
});
