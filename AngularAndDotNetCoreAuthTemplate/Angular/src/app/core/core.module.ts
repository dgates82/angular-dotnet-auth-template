import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    LoggerModule.forRoot({
      // serverLoggingUrl: '/api/log',
      level: NgxLoggerLevel.TRACE,
      // serverLogLevel: NgxLoggerLevel.DEBUG
    })
  ]
})
export class CoreModule { }
