import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AppService } from './app.service';
import { AnyGuard } from './auth/any.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('public/:file')
  async getPublicFile(@Param('file') file: string) {
    return await this.appService.getPublicFile(file);
  }

  @Get('/:user/:file')
  @UseGuards(new AnyGuard(new (AuthGuard('basic'))(), new (AuthGuard('jwt'))()))
  async getUserFile(
    @Req() req: Request,
    @Param('user') user: string,
    @Param('file') file: string,
  ) {
    if ((req.user as { name: string }).name !== user)
      throw new ForbiddenException();
    return await this.appService.getUserFile(user, file);
  }
}
