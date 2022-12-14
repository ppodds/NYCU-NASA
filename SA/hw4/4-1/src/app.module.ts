import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BasicStrategy } from './auth/http.strategy';
import { JwtStrategy } from './auth/jwt.strategy';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, BasicStrategy],
})
export class AppModule {}
