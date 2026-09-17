import { TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { ProfilePersonalInfoComponent } from './profile-personal-info.component';
import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import { IZippoResponse } from '@interfaces/address/zippo-response';

describe('ProfilePersonalInfoComponent', () => {
  let addressService: { getStates: ReturnType<typeof vi.fn>; getPlaceByZipCode: ReturnType<typeof vi.fn> };
  let userService: { update: ReturnType<typeof vi.fn> };
  let accountService: { resetAuthenticator: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  const baseUser = (): IApplicationUser => ({
    id: '1',
    email: 'user@example.com',
    emailConfirmed: true,
    twoFactorEnabled: false,
    hasSetPassword: true,
    isActive: true,
    firstName: 'Original',
    lastName: 'Name',
    phoneNumber: '5551234567',
    twoFactorMethod: undefined,
  });

  function createFixture(user: IApplicationUser) {
    const fixture = TestBed.createComponent(ProfilePersonalInfoComponent);
    fixture.componentInstance.user = user;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    addressService = {
      getStates: vi.fn().mockResolvedValue([]),
      getPlaceByZipCode: vi.fn(),
    };
    userService = { update: vi.fn() };
    accountService = { resetAuthenticator: vi.fn() };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as never);

    TestBed.configureTestingModule({
      imports: [ProfilePersonalInfoComponent],
      providers: [
        provideNgxMask(),
        { provide: AddressService, useValue: addressService },
        { provide: UserService, useValue: userService },
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  it('renders and populates the form from the input user', () => {
    const fixture = createFixture(baseUser());

    expect(fixture.componentInstance.firstName?.value).toBe('Original');
    expect(fixture.componentInstance.profileForm.disabled).toBe(true);
  });

  it('enables the form in edit mode and disables it again on cancel', () => {
    const fixture = createFixture(baseUser());

    fixture.componentInstance.onEditClick();
    expect(fixture.componentInstance.isEditMode).toBe(true);
    expect(fixture.componentInstance.firstName?.disabled).toBe(false);
    expect(fixture.componentInstance.email?.disabled).toBe(true);

    fixture.componentInstance.onCancelClick();
    expect(fixture.componentInstance.isEditMode).toBe(false);
    expect(fixture.componentInstance.firstName?.disabled).toBe(true);
  });

  it('does not save while the form is invalid', async () => {
    const fixture = createFixture(baseUser());
    fixture.componentInstance.onEditClick();
    // firstName is required per environment.requiredProfileFields - email is always
    // disabled (see handleFormState), so a disabled control can't be used to force invalidity.
    fixture.componentInstance.firstName?.setValue('');

    await fixture.componentInstance.onSaveClick();

    expect(userService.update).not.toHaveBeenCalled();
  });

  it('saves the updated profile and shows a confirmation when no phone/2FA conflict exists', async () => {
    const user = baseUser();
    const fixture = createFixture(user);
    fixture.componentInstance.onEditClick();
    userService.update.mockResolvedValue(user);

    fixture.componentInstance.firstName?.setValue('Updated');

    await fixture.componentInstance.onSaveClick();

    expect(userService.update).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Updated' }));
    expect(accountService.resetAuthenticator).not.toHaveBeenCalled();
    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Profile Updated' }));
    expect(fixture.componentInstance.isEditMode).toBe(false);
  });

  it('prompts to disable 2FA when the phone number changes and SMS 2FA is active, then saves on confirm', async () => {
    const user = { ...baseUser(), twoFactorMethod: 'Phone' };
    const fixture = createFixture(user);
    fixture.componentInstance.onEditClick();
    userService.update.mockResolvedValue(user);
    accountService.resetAuthenticator.mockResolvedValue({ isSuccess: true });

    fixture.componentInstance.phoneNumber?.setValue('5559999999');

    await fixture.componentInstance.onSaveClick();

    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Disable Two Factor Authentication' }));
    expect(accountService.resetAuthenticator).toHaveBeenCalledWith({ email: user.email });
    expect(userService.update).toHaveBeenCalled();
  });

  it('does not save when the user declines to disable 2FA', async () => {
    swalFireSpy.mockResolvedValue({ isConfirmed: false } as never);
    const user = { ...baseUser(), twoFactorMethod: 'Phone' };
    const fixture = createFixture(user);
    fixture.componentInstance.onEditClick();

    fixture.componentInstance.phoneNumber?.setValue('5559999999');

    await fixture.componentInstance.onSaveClick();

    expect(accountService.resetAuthenticator).not.toHaveBeenCalled();
    expect(userService.update).not.toHaveBeenCalled();
  });

  it('does not save when disabling 2FA fails', async () => {
    const user = { ...baseUser(), twoFactorMethod: 'Phone' };
    const fixture = createFixture(user);
    fixture.componentInstance.onEditClick();
    accountService.resetAuthenticator.mockRejectedValue(new Error('failed'));

    fixture.componentInstance.phoneNumber?.setValue('5559999999');

    await fixture.componentInstance.onSaveClick();

    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    expect(userService.update).not.toHaveBeenCalled();
  });

  it('populates city and state on a successful zip lookup', async () => {
    const fixture = createFixture(baseUser());
    const response = {
      postCode: '00000',
      places: [{ placeName: 'Springfield', stateAbbreviation: 'IL', state: 'Illinois', longitude: '0', latitude: '0' }]
    } as IZippoResponse;
    addressService.getPlaceByZipCode.mockResolvedValue(response);

    fixture.componentInstance.zipCode?.setValue('00000');
    fixture.componentInstance.onZipCodeChange();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.city?.value).toBe('Springfield');
    expect(fixture.componentInstance.zipLookupFailed).toBe(false);
  });

  it('flags a failed zip lookup', async () => {
    const fixture = createFixture(baseUser());
    addressService.getPlaceByZipCode.mockRejectedValue(new Error('not found'));

    fixture.componentInstance.zipCode?.setValue('99999');
    fixture.componentInstance.onZipCodeChange();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.zipLookupFailed).toBe(true);
  });
});
