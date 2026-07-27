import { Injectable, inject } from '@angular/core';

import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logger = inject(NGXLogger);


  private getMessaage(msg: string, obj?: unknown) {
    const result = `${msg} ${(obj) ? JSON.stringify(obj) : ""}`
    return result;
  }

  info(msg: string, obj?: unknown): void {
    this.logger.info(this.getMessaage(msg, obj));
  }

  debug(msg: string, obj?: unknown): void {
    this.logger.debug(this.getMessaage(msg, obj));
  }

  error(msg: string, obj?: unknown): void {
    this.logger.error(this.getMessaage(msg, obj));
  }

  trace(msg: string, obj?: unknown): void {
    this.logger.trace(this.getMessaage(msg, obj));
  }

}
