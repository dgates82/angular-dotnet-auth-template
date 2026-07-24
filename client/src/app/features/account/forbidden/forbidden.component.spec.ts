import { TestBed } from '@angular/core/testing';

import { ForbiddenComponent } from './forbidden.component';

describe('ForbiddenComponent', () => {
  it('creates and renders without errors', () => {
    TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
    });

    const fixture = TestBed.createComponent(ForbiddenComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
