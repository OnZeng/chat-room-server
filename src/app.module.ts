import { Module } from '@nestjs/common';
import { EventGateway } from './socket/event.gateway';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '/../dist-client'),
    }),
  ],
  controllers: [],
  providers: [EventGateway],
})
export class AppModule {}
