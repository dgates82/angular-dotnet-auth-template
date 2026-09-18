import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { RegisterUserComponent } from './register-user.component';
import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';
import { RoleService } from '@data/services/role.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import { IZippoResponse } from '@interfaces/address/zippo-response';

describe('RegisterUserComponent', () => {
  let addressService: { getStates: ReturnType<typeof vi.fn>; getPlaceByZipCode: ReturnType<typeof vi.fn> };
  let userService: { createUser: ReturnType<typeof vi.fn> };
  let roleService: { get: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  const validFormValue = {
    firstName: 'New',
    lastName: 'User',
    email: 'new.user@example.com',
    phoneNumber: '5551234567',
    streetAddress: '123 Main St',
    city: 'Springfield',
    zipCode: '00000',
    state: 'IL',
  };

  beforeEach(() => {
    addressService = {
      getStates: vi.fn().mockResolvedValue([]),
      getPlaceByZipCode: vi.fn(),
    };
    userService = { createUser: vi.fn() };
    roleService = { get: vi.fn().mockResolvedValue(['Admin', 'Tech']) };
    router = { navigate: vi.fn() };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as never);

    TestBed.configureTestingModule({
      imports: [RegisterUserComponent],
      providers: [
        provideNgxMask(),
        { provide: AddressService, useValue: addressService },
        { provide: UserService, useValue: userService },
        { provide: RoleService, useValue: roleService },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  it('renders and loads states and roles on init', async () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.availableRoles).toEqual(['Admin', 'Tech']);
  });

  it('does not attempt to save while the form is invalid', () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSaveClick();

    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('creates the user and navigates to the user list on success', async () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();
    const created = { id: '1', email: validFormValue.email } as IApplicationUser;
    userService.createUser.mockResolvedValue(created);

    fixture.componentInstance.newUserForm.patchValue(validFormValue);
    fixture.componentInstance.onSaveClick();

    await Promise.resolve();
    await Promise.resolve();

    expect(userService.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: validFormValue.email }));
    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'User created' }));
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('shows an error dialog when user creation fails', async () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();
    userService.createUser.mockRejectedValue(new Error('failed'));

    fixture.componentInstance.newUserForm.patchValue(validFormValue);
    fixture.componentInstance.onSaveClick();

    await Promise.resolve();
    await Promise.resolve();

    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates back to the user list when cancel is confirmed', async () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();

    fixture.componentInstance.onCancelClick();
    await Promise.resolve();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('does not navigate when cancel is not confirmed', async () => {
    swalFireSpy.mockResolvedValue({ isConfirmed: false } as never);
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();

    fixture.componentInstance.onCancelClick();
    await Promise.resolve();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('populates city and state on a successful zip lookup', async () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();
    const response = {
      postCode: '00000',
      places: [{ placeName: 'Springfield', stateAbbreviation: 'IL', state: 'Illinois', longitude: '0', latitude: '0' }]
    } as IZippoResponse;
    addressService.getPlaceByZipCode.mockResolvedValue(response);

    fixture.componentInstance.zipCode?.setValue('00000');
    fixture.componentInstance.onZipCodeChange();
    await Promise.resolve();

    expect(fixture.componentInstance.city?.value).toBe('Springfield');
    expect(fixture.componentInstance.state?.value).toBe('IL');
    expect(fixture.componentInstance.zipLookupFailed).toBe(false);
  });

  it('flags a failed zip lookup', async () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();
    addressService.getPlaceByZipCode.mockRejectedValue(new Error('not found'));

    fixture.componentInstance.zipCode?.setValue('99999');
    fixture.componentInstance.onZipCodeChange();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.zipLookupFailed).toBe(true);
  });

  it('adds and removes roles', () => {
    const fixture = TestBed.createComponent(RegisterUserComponent);
    fixture.detectChanges();

    fixture.componentInstance.addRole('Admin');
    expect(fixture.componentInstance.roles.value).toEqual(['Admin']);

    fixture.componentInstance.removeRole(0);
    expect(fixture.componentInstance.roles.value).toEqual([]);
  });
});
