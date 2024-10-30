import { Injectable } from '@angular/core';

import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor(private logger: NGXLogger) { }

  private getMessaage(msg: string, obj?: any) {
    var result = `${msg} ${(obj) ? JSON.stringify(obj) : ""}`
    return result;
  }

  info(msg: string, obj?: any): void {
    this.logger.info(this.getMessaage(msg, obj));
  }

  debug(msg: string, obj?: any): void {
    this.logger.debug(this.getMessaage(msg, obj));
  }

  error(msg: string, obj?: any): void {
    this.logger.error(this.getMessaage(msg, obj));
  }

  trace(msg: string, obj?: any): void {
    this.logger.trace(this.getMessaage(msg, obj));
  }

}
