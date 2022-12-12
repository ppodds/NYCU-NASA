import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AppService {
  async getDiskInfo(): Promise<number> {
    const result = await execAsync(`df / | sed 1d | awk '{printf $2 " " $4}'`);
    const [total, free] = result.stdout.split(' ').map((x) => parseInt(x));
    return 1 - free / total;
  }
  async getUptime(): Promise<number> {
    const bootTime = await execAsync(
      `sysctl kern.boottime | grep -E -o '[0-9]+' | head -n 1`,
    );
    return Math.floor(new Date().getTime() / 1000) - parseInt(bootTime.stdout);
  }
  getTime(): number {
    return Math.floor(new Date().getTime() / 1000);
  }
}
