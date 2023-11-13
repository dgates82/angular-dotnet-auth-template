import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from '@shared/shared.module';
import { FeaturesModule } from '@features/features.module';
import { InterfacesModule } from '@interfaces/interfaces.module';
import { DataModule } from '@data/data.module';
import { CoreModule} from '@core/core.module';
import { APP_BASE_HREF } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { JwtModule } from "@auth0/angular-jwt";

import { NgxMaskModule } from 'ngx-mask';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

/*import { library } from '@fortawesome/fontawesome-svg-core';
import { fausers } from '@fortawesome/free-solid-svg-icons';
library.add(fausers);*/

export function tokenGetter() {
  // HACK: Any way to use the method in the account service here?
  var response = localStorage.getItem('authResponse');
  if (response) {
    var authResponse = JSON.parse(response ?? "");
    return authResponse?.token;
  } else {
    return "";
  }
  

}

@NgModule({
  declarations: [
    AppComponent
    
  ],
  imports: [    
    BrowserModule,
    AppRoutingModule,    
    RouterModule,

    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ["localhost:44359"],
      }
    }),
    
    NgxMaskModule.forRoot(),
    SweetAlert2Module.forRoot(),

    SharedModule,
    FeaturesModule,
    InterfacesModule,
    DataModule,
    CoreModule
    
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/'},
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' }}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
