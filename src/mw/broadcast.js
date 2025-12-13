import { removePrivacyFields } from '../utils/index.js';
// 向指定房间转发数据
export function broadcastToRoom(socket, allDB, room) {
    const { userDB, msgDB, logDB } = allDB;
    // 查询当前在线用户(删除部分隐私字段)
    const onlineUsers = userDB.data.filter(item => item.online === 1).map(item => removePrivacyFields(item));
    // 大厅聊天记录
    const msgList = msgDB.data.map(item => item);
    // 大厅日志
    const logList = logDB.data.map(item => item);
    socket.to(room).emit('data', {
        onlineUsers,
        msgList,
        logList,
    })
    socket.emit('data', {
        onlineUsers,
        msgList,
        logList,
    })
}