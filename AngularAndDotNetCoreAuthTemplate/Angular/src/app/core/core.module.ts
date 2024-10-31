import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { ObfuscateEmailPipe } from './pipes/obfuscate-email.pipe';
import { ObfuscatePhonePipe } from './pipes/obfuscate-phone.pipe';



@NgModule({ declarations: [
        ObfuscateEmailPipe,
        ObfuscatePhonePipe
    ],
    exports: [
        ObfuscateEmailPipe
    ], imports: [CommonModule,
        LoggerModule.forRoot({
            // serverLoggingUrl: '/api/log',
            level: NgxLoggerLevel.TRACE,
            // serverLogLevel: NgxLoggerLevel.DEBUG
        })], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CoreModule { }
