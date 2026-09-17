import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AddressService } from './address.service';
import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { IState } from '@interfaces/address/state';

describe('AddressService', () => {
  let service: AddressService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AddressService,
        HttpErrorService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });

    service = TestBed.inject(AddressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getStates', () => {
    it('gets the states list', async () => {
      const states: IState[] = [{ name: 'Illinois', abbreviation: 'IL' } as IState];
      const promise = service.getStates();

      const req = httpMock.expectOne('../assets/data/states.json');
      expect(req.request.method).toBe('GET');
      req.flush(states);

      await expect(promise).resolves.toEqual(states);
    });
  });

  describe('getPlaceByZipCode', () => {
    it('maps the raw Zippopotam response to the app shape', async () => {
      const rawResponse = {
        'post code': '62701',
        places: [{
          'place name': 'Springfield',
          longitude: '-89.6501',
          state: 'Illinois',
          'state abbreviation': 'IL',
          latitude: '39.7817',
        }],
      };
      const promise = service.getPlaceByZipCode('62701');

      const req = httpMock.expectOne('https://api.zippopotam.us/us/62701');
      expect(req.request.method).toBe('GET');
      req.flush(rawResponse);

      await expect(promise).resolves.toEqual({
        postCode: '62701',
        places: [{
          placeName: 'Springfield',
          longitude: '-89.6501',
          state: 'Illinois',
          stateAbbreviation: 'IL',
          latitude: '39.7817',
        }],
      });
    });
  });
});
