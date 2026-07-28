import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';

import { IState } from '@interfaces/address/state';
import { catchError, map, tap } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { HttpErrorService } from '@core/services/http-error.service';
import { IZippoResponse } from '@interfaces/address/zippo-response';
import { SKIP_ERROR_DIALOG } from '@core/interceptors/error.interceptor';

// Low-stakes conveniences - opt out of the global error interceptor's dialog.
const silentContext = new HttpContext().set(SKIP_ERROR_DIALOG, true);

interface IZippoPlaceRaw {
  'place name': string;
  longitude: string;
  state: string;
  'state abbreviation': string;
  latitude: string;
}

interface IZippoResponseRaw {
  'post code': string;
  places: IZippoPlaceRaw[];
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private logger = inject(LoggerService);
  private httpClient = inject(HttpClient);
  private errorService = inject(HttpErrorService);


  getStates(): Promise<IState[]> {
    const url = '../assets/data/states.json';

    return lastValueFrom(this.httpClient.get<IState[]>(url, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`address.service.getStates | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  getPlaceByZipCode(zipCode: string): Promise<IZippoResponse> {
    const url = `https://api.zippopotam.us/us/${zipCode}`;
    
    return lastValueFrom(this.httpClient.get<IZippoResponseRaw>(url, { context: silentContext }).pipe(
      tap(response => { this.logger.trace(`address.service.getPlaceByZipCode | response:`, response) }),
      map((response: IZippoResponseRaw) => ({
        postCode: response['post code'],
        places: response.places.map((place: IZippoPlaceRaw) => ({
          placeName: place['place name'],
          longitude: place.longitude,
          state: place.state,
          stateAbbreviation: place['state abbreviation'],
          latitude: place.latitude,
        })),
      } as IZippoResponse)),
      catchError(err => this.errorService.handleError(err))
    ));

  }

}
