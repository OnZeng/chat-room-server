import { broadcastToRoom } from '../middlewares/index.js';

// 断开连接
export default function disconnect(socket, allDB) {
    socket.on('disconnect', () => {
        // console.log(`${socket.id}断开连接`);
        const { userDB, logDB } = allDB;
        const user = userDB.data.find(item => item.socketId === socket.id);
        // 记录大厅日志
        logDB.data.push(`${user?.uuid} 断开连接 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
        logDB.write();
        // 更新用户状态为离线
        userDB.data.forEach(item => {
            if (item.socketId === socket.id) {
                item.socketId = null
                item.online = 0;
            }
        })
        userDB.write()
        // 离开权限组
        socket.leave('hall');
        // 转发数据
        broadcastToRoom(socket, allDB, 'hall')
    });
}