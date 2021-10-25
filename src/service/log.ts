export class Log {
  private logger: any
  constructor (logger?: any) {
    this.logger = logger
  }

  info (info: any) {
    if (this.logger) {
      this.logger.info(info)
    } else {
      console.info(info)
    }
  }

  warning (info: any) {
    if (this.logger) {
      this.logger.warning(info)
    } else {
      console.log(info)
    }
  }

  error (info: any) {
    if (this.logger) {
      this.logger.error(info)
    } else {
      console.error(info)
    }
  }
}
