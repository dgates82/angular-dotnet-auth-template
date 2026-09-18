import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';

import { EditUserComponent } from './edit-user.component';
import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { IApplicationUser } from '@interfaces/account/application-user';

describe('EditUserComponent', () => {
  let userService: { getById: ReturnType<typeof vi.fn> };
  let activatedRoute: { paramMap: Observable<ParamMap> };

  function configure(paramMapValue: Record<string, string>) {
    activatedRoute = { paramMap: of(convertToParamMap(paramMapValue)) };

    TestBed.configureTestingModule({
      imports: [EditUserComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  }

  beforeEach(() => {
    userService = { getById: vi.fn() };
  });

  it('loads the user by the route id param', async () => {
    const user = { id: '1', email: 'admin@example.com' } as IApplicationUser;
    userService.getById.mockResolvedValue(user);
    configure({ id: '1' });

    // Deliberately not calling fixture.detectChanges() a second time after the async
    // load resolves - doing so would render the real AdminPersonalInfoComponent/
    // AdminSecurityInfoComponent children, which need their own provider setup;
    // asserting component state directly is enough to cover ngOnInit's own logic.
    const fixture = TestBed.createComponent(EditUserComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(userService.getById).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.user).toEqual(user);
    expect(fixture.componentInstance.loadError).toBe(false);
  });

  it('sets loadError when the user fails to load', async () => {
    userService.getById.mockRejectedValue(new Error('not found'));
    configure({ id: '1' });

    const fixture = TestBed.createComponent(EditUserComponent);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.loadError).toBe(true);
  });

  it('does not attempt to load a user when the route has no id param', () => {
    configure({});

    const fixture = TestBed.createComponent(EditUserComponent);
    fixture.detectChanges();

    expect(userService.getById).not.toHaveBeenCalled();
  });
});
