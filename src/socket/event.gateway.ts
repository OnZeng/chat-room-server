import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessageDto, UserDto } from './dto';

@WebSocketGateway({
  cors: true,
})
export class EventGateway {
  @WebSocketServer() server: Server;
  // 历史人数
  historyCount: number = 0;
  // 聊天记录
  messageLists: any = [];
  // 在线用户
  onlineUsers: any = [];
  // 日志
  logs: string[] = [];
  // 记录
  i: number = 0;
  /**
   * @description 客户端连接时触发
   */
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`用户 连接: ${client.id}`);

    // 通知其他用户
    this.server.emit('connection', {
      messageLists: this.messageLists,
      onlineUsers: this.onlineUsers,
      logs: this.logs,
      historyCount: this.historyCount,
    });
  }

  /**
   * @description 客户端断开连接时触发
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // 移除在线用户
    this.onlineUsers = this.onlineUsers.filter((item: any) => {
      this.logs.push(
        `${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} ${item.name} 离开聊天室`,
      );
      return item.id !== client.id;
    });

    // 通知其他用户
    this.server.emit('onlineUsers', this.onlineUsers);
    this.server.emit('logs', this.logs);
    this.server.emit('historyCount', this.historyCount);
  }

  /**
   * @description 监听客户端的消息事件
   */
  @SubscribeMessage('newMessage')
  handleMessage(@MessageBody() body: MessageDto) {
    if (this.messageLists.length > 200) {
      this.i += 1;
      this.messageLists = [];
      this.logs.push(
        `${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} 聊天记录已清空${this.i}次`,
      );
    }
    this.onlineUsers.map((item: any) => {
      if (item.id === body.id) {
        this.logs.push(
          `${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} ${item.name} 发送了一条消息`,
        );
      }
    });
    this.messageLists.push(body);

    // 通知其他用户
    this.server.emit('newMessage', this.messageLists);
    this.server.emit('onlineUsers', this.onlineUsers);
    this.server.emit('logs', this.logs);
    this.server.emit('historyCount', this.historyCount);
  }

  /**
   * @description 监听客户端的登录事件
   */
  @SubscribeMessage('onlineUsers')
  handleMessage2(@MessageBody() body: UserDto) {
    this.onlineUsers.push(body);
    this.logs.push(
      `${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} ${body.name} 加入聊天室`,
    );
    this.historyCount += 1;
    // 通知其他用户
    this.server.emit('onlineUsers', this.onlineUsers);
    this.server.emit('logs', this.logs);
    this.server.emit('historyCount', this.historyCount);
  }
}
