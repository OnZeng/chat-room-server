import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class EventGateway {
  @WebSocketServer() server: Server;
  list: any = [];

  // 客户端连接时触发
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);

    this.server.emit('connection', this.list);
  }

  // 监听客户端的消息
  @SubscribeMessage('newMessage')
  handleMessage(@MessageBody() body: any) {
    this.list.push(body);
    this.server.emit('newMessage', this.list);
  }
}
