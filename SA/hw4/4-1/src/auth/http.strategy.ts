import { BasicStrategy as Strategy } from 'passport-http';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async validate(
    username: string,
    password: string,
  ): Promise<{ name: string } | false> {
    if (await this.authService.validateUser(username, password))
      return { name: username };
    return false;
  }
}
