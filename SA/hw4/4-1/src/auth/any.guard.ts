import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AnyGuard implements CanActivate {
  private readonly guards: CanActivate[];
  constructor(...guards: CanActivate[]) {
    this.guards = guards;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    for (const guard of this.guards) {
      try {
        if (await guard.canActivate(context)) return true;
      } catch (e) {}
    }
    return false;
  }
}
