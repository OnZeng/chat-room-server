import { checkSocketToken, broadcastToRoom } from '../mw/index.js';
import { isLength, isNoSpace, isToken } from '../utils/index.js';

export default function sendMsg(socket, allDB) {
  const { msgDB, logDB, userDB } = allDB;
  socket.on('sendMsg', (arg, callback) => {
    const { content, token } = arg || {};

    isToken(token, '不是一个有效token', callback);
    isNoSpace(content, '消息内容不能发送空字符', callback);
    isLength(content, 1, 100, '消息内容长度必须在1-100之间', callback);
    // 验证并获取token中的用户信息
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    if (!tokenVal.name || !tokenVal.avatar) {
      // 更新用户状态为离线
      userDB.data.forEach(item => {
        if (item.uuid === tokenVal.uuid) {
          item.socketId = null;
          item.online = 0;
        }
      });
      userDB.write();
      return callback({
        code: -2,
        type: 'error',
        data: {},
        message: '账号未完善信息，请重新登录并完善账号信息'
      });
    }
    // 发送消息
    msgDB.data.push({
      uuid: tokenVal.uuid,
      name: tokenVal.name,
      avatar: tokenVal.avatar,
      content,
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    });
    msgDB.write();
    // 记录大厅日志
    logDB.data.push(
      `${tokenVal.uuid} 发送消息 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai'
      })}`
    );
    logDB.write();
    // 转发数据
    broadcastToRoom(socket, allDB, 'hall');
  });
}
