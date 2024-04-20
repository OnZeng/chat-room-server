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
  // 聊天记录
  messageLists: any = [];
  // 在线用户
  onlineUsers: any = [];
  // 客户端连接时触发
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`用户 连接: ${client.id}`);
    this.server.emit('connection', {
      messageLists: this.messageLists,
      onlineUsers: this.onlineUsers,
    });
  }
  // 客户端断开连接时触发
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // 移除在线用户
    this.onlineUsers = this.onlineUsers.filter(
      (item: any) => item.id !== client.id,
    );
    this.server.emit('onlineUsers', this.onlineUsers);
  }

  // 监听客户端的消息
  @SubscribeMessage('newMessage')
  handleMessage(@MessageBody() body: any) {
    this.messageLists.push(body);
    this.server.emit('newMessage', this.messageLists);
    this.server.emit('onlineUsers', this.onlineUsers);
  }
  // 监听客户端的在线用户
  @SubscribeMessage('onlineUsers')
  handleMessage2(@MessageBody() body: any) {
    // console.log(body);
    this.onlineUsers.push(body);
    this.server.emit('onlineUsers', this.onlineUsers);
  }
}
