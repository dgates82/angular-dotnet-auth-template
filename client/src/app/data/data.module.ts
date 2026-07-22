import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { CoreModule } from '@core/core.module';

@NgModule({ declarations: [], imports: [CommonModule,
        CoreModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class DataModule { }
