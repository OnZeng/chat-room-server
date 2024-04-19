import { Module } from '@nestjs/common';
import { EventGateway } from './socket/event.gateway';
@Module({
  imports: [],
  controllers: [],
  providers: [EventGateway],
})
export class AppModule {}
