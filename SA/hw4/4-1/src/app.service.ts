import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { lstat } from 'fs/promises';
import { ConfigService } from './config/config.service';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  async getUserFile(user: string, file: string): Promise<StreamableFile> {
    const path = `data/static/${user}/${file}`;
    return await this.getStreamableFile(path);
  }

  async getPublicFile(file: string): Promise<StreamableFile> {
    const path = `data/static/public/${file}`;
    return await this.getStreamableFile(path);
  }

  private async getStreamableFile(path: string): Promise<StreamableFile> {
    try {
      const stat = await lstat(path);
      if (!stat.isFile()) throw new NotFoundException();
      return new StreamableFile(createReadStream(path), {
        disposition: 'attachment;',
      });
    } catch (e) {
      throw new NotFoundException();
    }
  }
}
