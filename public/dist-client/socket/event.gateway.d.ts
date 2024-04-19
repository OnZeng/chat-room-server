import { Socket, Server } from 'socket.io';
export declare class EventGateway {
    server: Server;
    list: any;
    handleConnection(client: Socket): void;
    handleMessage(body: any): void;
}
