import { TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { AdminPersonalInfoComponent } from './admin-personal-info.component';
import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';
import { RoleService } from '@data/services/role.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import { IZippoResponse } from '@interfaces/address/zippo-response';

describe('AdminPersonalInfoComponent', () => {
  let addressService: { getStates: ReturnType<typeof vi.fn>; getPlaceByZipCode: ReturnType<typeof vi.fn> };
  let userService: { update: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn>; activate: ReturnType<typeof vi.fn> };
  let roleService: { get: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  const baseUser = (): IApplicationUser => ({
    id: '1',
    email: 'target@example.com',
    emailConfirmed: true,
    twoFactorEnabled: false,
    hasSetPassword: true,
    isActive: true,
    firstName: 'Original',
    lastName: 'Name',
    roles: ['Tech'],
  });

  function createFixture(user: IApplicationUser) {
    const fixture = TestBed.createComponent(AdminPersonalInfoComponent);
    fixture.componentInstance.user = user;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    addressService = {
      getStates: vi.fn().mockResolvedValue([]),
      getPlaceByZipCode: vi.fn(),
    };
    userService = { update: vi.fn(), deactivate: vi.fn(), activate: vi.fn() };
    roleService = { get: vi.fn().mockResolvedValue(['Admin', 'Tech']) };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as never);

    TestBed.configureTestingModule({
      imports: [AdminPersonalInfoComponent],
      providers: [
        provideNgxMask(),
        { provide: AddressService, useValue: addressService },
        { provide: UserService, useValue: userService },
        { provide: RoleService, useValue: roleService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  it('renders, loads roles, and populates the form (including roles) from the input user', async () => {
    const fixture = createFixture(baseUser());
    await Promise.resolve();

    expect(fixture.componentInstance.availableRoles).toEqual(['Admin', 'Tech']);
    expect(fixture.componentInstance.firstName?.value).toBe('Original');
    expect(fixture.componentInstance.roles.value).toEqual(['Tech']);
    expect(fixture.componentInstance.profileForm.disabled).toBe(true);
  });

  it('keeps roles and email disabled even in edit mode', () => {
    const fixture = createFixture(baseUser());

    fixture.componentInstance.onEditClick();

    expect(fixture.componentInstance.isEditMode).toBe(true);
    expect(fixture.componentInstance.firstName?.disabled).toBe(false);
    expect(fixture.componentInstance.email?.disabled).toBe(true);
    expect(fixture.componentInstance.roles.controls.every(c => c.disabled)).toBe(true);
  });

  it('does not save while the form is invalid', () => {
    const fixture = createFixture(baseUser());
    fixture.componentInstance.onEditClick();
    fixture.componentInstance.firstName?.setValue('');

    fixture.componentInstance.onSaveClick();

    expect(userService.update).not.toHaveBeenCalled();
  });

  it('saves the updated profile and shows a confirmation on success', async () => {
    const user = baseUser();
    const fixture = createFixture(user);
    fixture.componentInstance.onEditClick();
    userService.update.mockResolvedValue(user);

    fixture.componentInstance.firstName?.setValue('Updated');
    fixture.componentInstance.onSaveClick();
    await Promise.resolve();

    expect(userService.update).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Updated', roles: ['Tech'] }));
    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'User Updated' }));
    expect(fixture.componentInstance.isEditMode).toBe(false);
  });

  it('adds and removes roles via addRole/removeRole', () => {
    const fixture = createFixture(baseUser());

    // roles.value excludes the seeded "Tech" control since setFormValues() disables it -
    // getRawValue() includes disabled controls too.
    fixture.componentInstance.addRole('Admin');
    expect(fixture.componentInstance.roles.getRawValue()).toEqual(['Tech', 'Admin']);

    fixture.componentInstance.removeRole(0);
    expect(fixture.componentInstance.roles.getRawValue()).toEqual(['Admin']);
  });

  it('deactivates the user when confirmed', async () => {
    const fixture = createFixture(baseUser());
    userService.deactivate.mockResolvedValue({ isSuccess: true });

    fixture.componentInstance.onDeactivateClick();
    await Promise.resolve();
    await Promise.resolve();

    expect(userService.deactivate).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.user.isActive).toBe(false);
    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'User deactivated' }));
  });

  it('does not deactivate when the confirmation is declined', async () => {
    swalFireSpy.mockResolvedValue({ isConfirmed: false } as never);
    const fixture = createFixture(baseUser());

    fixture.componentInstance.onDeactivateClick();
    await Promise.resolve();

    expect(userService.deactivate).not.toHaveBeenCalled();
  });

  it('shows an error dialog when deactivation fails', async () => {
    const fixture = createFixture(baseUser());
    userService.deactivate.mockRejectedValue(new Error('failed'));

    fixture.componentInstance.onDeactivateClick();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'An error occurred', text: 'User could not be deactivated' }));
    expect(fixture.componentInstance.user.isActive).toBe(true);
  });

  it('re-activates the user when confirmed', async () => {
    const user = { ...baseUser(), isActive: false };
    const fixture = createFixture(user);
    userService.activate.mockResolvedValue({ isSuccess: true });

    fixture.componentInstance.onActivateClick();
    await Promise.resolve();
    await Promise.resolve();

    expect(userService.activate).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.user.isActive).toBe(true);
    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'User re-activated' }));
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
