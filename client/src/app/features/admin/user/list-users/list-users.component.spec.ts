import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ListUsersComponent } from './list-users.component';
import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { IApplicationUser } from '@interfaces/account/application-user';

describe('ListUsersComponent', () => {
  let userService: { get: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const activeUser = { id: '1', email: 'active@example.com', firstName: 'Active', lastName: 'User', isActive: true } as IApplicationUser;
  const inactiveUser = { id: '2', email: 'inactive@example.com', firstName: 'Inactive', lastName: 'User', isActive: false } as IApplicationUser;

  beforeEach(() => {
    userService = { get: vi.fn().mockResolvedValue([activeUser, inactiveUser]) };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ListUsersComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  describe('reloadData', () => {
    it('excludes inactive users by default', async () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();
      await Promise.resolve();

      expect(fixture.componentInstance.dataSource.data).toEqual([activeUser]);
    });

    it('includes inactive users when includeInactiveUsers is true', async () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.componentInstance.includeInactiveUsers = true;
      fixture.detectChanges();
      await Promise.resolve();

      expect(fixture.componentInstance.dataSource.data).toEqual([activeUser, inactiveUser]);
    });
  });

  describe('filterPredicate', () => {
    it('matches on email, name, and status', () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();
      const predicate = fixture.componentInstance.dataSource.filterPredicate;

      expect(predicate(activeUser, 'active@example.com')).toBe(true);
      expect(predicate(activeUser, 'inactive')).toBe(false);
      expect(predicate(inactiveUser, 'inactive')).toBe(true);
    });
  });

  describe('sortingDataAccessor', () => {
    it('maps the status column to a numeric isActive value', () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();
      const accessor = fixture.componentInstance.dataSource.sortingDataAccessor;

      expect(accessor(activeUser, 'status')).toBe(1);
      expect(accessor(inactiveUser, 'status')).toBe(0);
    });

    it('falls back to the raw property for other columns', () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();
      const accessor = fixture.componentInstance.dataSource.sortingDataAccessor;

      expect(accessor(activeUser, 'email')).toBe('active@example.com');
    });
  });

  describe('applyFilter', () => {
    it('sets the datasource filter from the input value', () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();
      const event = { target: { value: '  Someone  ' } } as unknown as Event;

      fixture.componentInstance.applyFilter(event);

      expect(fixture.componentInstance.dataSource.filter).toBe('someone');
    });
  });

  describe('onAddUser', () => {
    it('navigates to the register-user page', () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();

      fixture.componentInstance.onAddUser();

      expect(router.navigate).toHaveBeenCalledWith(['/admin/register-user']);
    });
  });

  describe('onDetails', () => {
    it('navigates to the edit-user page for the given id', () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();

      fixture.componentInstance.onDetails('1');

      expect(router.navigate).toHaveBeenCalledWith(['/admin/edit-user', '1']);
    });
  });

  describe('onIncludeInactiveUsersChanged', () => {
    it('updates the flag and reloads data', async () => {
      const fixture = TestBed.createComponent(ListUsersComponent);
      fixture.detectChanges();
      await Promise.resolve();
      userService.get.mockClear();

      fixture.componentInstance.onIncludeInactiveUsersChanged({ checked: true } as never);
      await Promise.resolve();

      expect(fixture.componentInstance.includeInactiveUsers).toBe(true);
      expect(userService.get).toHaveBeenCalled();
      expect(fixture.componentInstance.dataSource.data).toEqual([activeUser, inactiveUser]);
    });
  });
});
