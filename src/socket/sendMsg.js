import { checkSocketToken, broadcastToRoom } from '../mw/index.js';
import { isLength, isNoSpace, isToken } from '../utils/index.js';

export default function sendMsg(socket, allDB) {
  const { msgDB, logDB } = allDB;
  socket.on('sendMsg', (arg, callback) => {
    const { content, token } = arg || {};

    isToken(token, '不是一个有效token', callback);
    isNoSpace(content, '消息内容不能有空格', callback);
    isLength(content, 1, 100, '消息内容长度必须在1-100之间', callback);
    // 验证并获取token中的用户信息
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    if (tokenVal.name === null || tokenVal.avatar === null) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号未完善信息，请重新登录并完善账号信息',
      });
    }
    // 发送消息
    msgDB.data.push({
      uuid: tokenVal.uuid,
      name: tokenVal.name,
      avatar: tokenVal.avatar,
      content,
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    });
    msgDB.write();
    // 记录大厅日志
    logDB.data.push(
      `${tokenVal.uuid} 发送消息 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })}`
    );
    logDB.write();
    // 转发数据
    broadcastToRoom(socket, allDB, 'hall');
  });
}
