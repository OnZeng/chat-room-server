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
  // 日志
  logs: any = [];

  // 客户端连接时触发
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`用户 连接: ${client.id}`);

    // 通知其他用户
    this.server.emit('connection', {
      messageLists: this.messageLists,
      onlineUsers: this.onlineUsers,
      logs: this.logs,
    });
  }
  // 客户端断开连接时触发
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // 移除在线用户
    this.onlineUsers = this.onlineUsers.filter((item: any) => {
      this.logs.push(`${new Date().toLocaleString()} ${item.name} 离开聊天室`);
      return item.id !== client.id;
    });

    // 通知其他用户
    this.server.emit('onlineUsers', this.onlineUsers);
    this.server.emit('logs', this.logs);
  }

  // 监听客户端的消息
  @SubscribeMessage('newMessage')
  handleMessage(@MessageBody() body: any) {
    this.onlineUsers.map((item: any) => {
      if (item.id === body.id) {
        this.logs.push(
          `${new Date().toLocaleString()} ${item.name} 发送了一条消息`,
        );
      }
    });
    this.messageLists.push(body);

    // 通知其他用户
    this.server.emit('newMessage', this.messageLists);
    this.server.emit('onlineUsers', this.onlineUsers);
    this.server.emit('logs', this.logs);
  }
  // 监听客户端的在线用户
  @SubscribeMessage('onlineUsers')
  handleMessage2(@MessageBody() body: any) {
    this.onlineUsers.push(body);
    this.logs.push(`${new Date().toLocaleString()} ${body.name} 加入聊天室`);

    // 通知其他用户
    this.server.emit('onlineUsers', this.onlineUsers);
    this.server.emit('logs', this.logs);
  }
}
