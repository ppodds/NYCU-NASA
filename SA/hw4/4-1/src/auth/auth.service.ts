import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly _users = new Map<string, string>();
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    for (const user of this.configService.getConfig().users)
      this._users.set(user.username, user.password);
  }

  public async validateUser(
    username: string,
    password: string,
  ): Promise<boolean> {
    const userPassword = this._users.get(username);
    return userPassword && (await bcrypt.compare(password, userPassword));
  }

  public async login(username: string, password: string): Promise<string> {
    if (await this.validateUser(username, password))
      return await this.jwtService.signAsync({ user: username });
    else throw new ForbiddenException();
  }
}
