import { removePrivacyFields } from '../utils/index.js';
// 向指定房间转发数据
export async function broadcastToRoom(socket, allDB, room) {
  const { userDB, msgDB, logDB, configDB } = allDB;
  // 检测账号是否已初始化
  const user = await userDB.data.find(item => item.socketId === socket.id);
  if (user === undefined) {
    return;
  }
  if (!user.name || !user.avatar) {
    // 更新用户状态为离线
    userDB.data.forEach(item => {
      if (item.uuid === user.uuid) {
        item.socketId = null;
        item.online = 0;
      }
    });
    userDB.write();
    socket.emit('init', {
      code: -2,
      type: 'error',
      data: {},
      message: '账号未完善信息，请先完善账号信息'
    });
    return;
  }
  // 查询当前在线用户(删除部分隐私字段)
  const onlineUsers = userDB.data
    .filter(item => item.online === 1)
    .map(item => removePrivacyFields(item));
  // 大厅聊天记录
  const msgList = msgDB.data.map(item => item);
  // 大厅日志
  const logList = logDB.data.map(item => item);
  // 大厅连接次数
  const connCount = configDB.data.connCount;
  socket.to(room).emit('data', {
    onlineUsers,
    msgList,
    logList,
    connCount
  });
  socket.emit('data', {
    onlineUsers,
    msgList,
    logList,
    connCount
  });
}
