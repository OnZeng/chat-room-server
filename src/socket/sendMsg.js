import { checkSocketToken, broadcastToRoom, broadcastNewMessage, invalidateOnlineUsersCache } from '../mw/index.js';
import { isLength, isNoSpace, isToken } from '../utils/index.js';

export default function sendMsg(socket, allDB, io) {
  const { msgCache, logCache, userCache } = allDB;
  socket.on('sendMsg', (arg, callback) => {
    const { content, token } = arg || {};

    isToken(token, '不是一个有效token', callback);
    isNoSpace(content, '消息内容不能发送空字符', callback);
    isLength(content, 1, 100, '消息内容长度必须在1-100之间', callback);
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    const user = userCache.findByUuid(tokenVal.uuid);
    if (!user || !user.name || !user.avatar) {
      if (user) {
        userCache.removeSocketId(user.socketId);
      }
      return callback({
        code: -2,
        type: 'error',
        data: {},
        message: '账号未完善信息，请重新登录并完善账号信息'
      });
    }
    const message = msgCache.addMessage({
      uuid: tokenVal.uuid,
      name: tokenVal.name,
      avatar: tokenVal.avatar,
      content,
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    });
    logCache.addLog(
      `${tokenVal.uuid} 发送消息 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai'
      })}`
    );
    broadcastNewMessage(io, allDB, 'hall', message);
    callback({
      code: 1,
      type: 'success',
      data: {},
      message: '发送成功'
    });
  });
}
