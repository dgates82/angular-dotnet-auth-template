import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { ObfuscateEmailPipe } from './pipes/obfuscate-email.pipe';



@NgModule({
  declarations: [
    ObfuscateEmailPipe
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    LoggerModule.forRoot({
      // serverLoggingUrl: '/api/log',
      level: NgxLoggerLevel.TRACE,
      // serverLogLevel: NgxLoggerLevel.DEBUG
    })
  ], exports: [
    ObfuscateEmailPipe
  ]
})
export class CoreModule { }
