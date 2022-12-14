import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Config } from 'src/config';

@Injectable()
export class ConfigService {
  private readonly _config: Config;
  constructor() {
    this._config = JSON.parse(readFileSync('config.json', 'utf8'));
  }

  public getConfig(): Config {
    return this._config;
  }
}
