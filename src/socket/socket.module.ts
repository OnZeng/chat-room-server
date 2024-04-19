import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketService } from './socket.service';
import { EventGateway } from './event.gateway';
@Module({
  controllers: [SocketController],
  providers: [SocketService, EventGateway],
})
export class SocketModule {}
