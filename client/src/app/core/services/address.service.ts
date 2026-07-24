import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';

import { IState } from '@interfaces/address/state';
import { catchError, map, tap } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { HttpErrorService } from '@core/services/http-error.service';
import { IZippoResponse } from '@interfaces/address/zippo-response';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  constructor(private logger: LoggerService,
    private httpClient: HttpClient,
    private errorService: HttpErrorService) { }

  getStates(): Promise<IState[]> {
    const url = '../assets/data/states.json';

    return lastValueFrom(this.httpClient.get<IState[]>(url).pipe(
      tap(response => this.logger.trace(`address.service.getStates | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  getPlaceByZipCode(zipCode: string): Promise<IZippoResponse> {
    const url = `https://api.zippopotam.us/us/${zipCode}`;
    
    return lastValueFrom(this.httpClient.get<IZippoResponse>(url).pipe(
      tap(response => { this.logger.trace(`address.service.getPlaceByZipCode | response:`, response) }),
      map((response: any) => ({
        postCode: response['post code'],                
        places: response.places.map((place: any) => ({
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
