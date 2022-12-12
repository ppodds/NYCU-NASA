import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async healthCheck(): Promise<{ disk: number; uptime: number; time: number }> {
    return {
      disk: await this.appService.getDiskInfo(),
      uptime: await this.appService.getUptime(),
      time: this.appService.getTime(),
    };
  }
}
