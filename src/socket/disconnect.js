import { broadcastUserStatusChange, invalidateOnlineUsersCache } from '../mw/index.js';

export default function disconnect(socket, allDB, io) {
    socket.on('disconnect', () => {
        const { userCache, logCache } = allDB;
        const user = userCache.findBySocketId(socket.id);
        if (user) {
            logCache.addLog(`${user.uuid} 断开连接 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
            userCache.removeSocketId(socket.id);
            invalidateOnlineUsersCache();
        }
        socket.leave('hall');
        broadcastUserStatusChange(io, allDB, 'hall');
    });
}