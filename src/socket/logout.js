import { checkSocketToken, broadcastUserStatusChange, invalidateOnlineUsersCache } from '../mw/index.js';
import { isToken } from '../utils/index.js';

export default function (socket, allDB, io) {
  const { userCache, logCache } = allDB;
  socket.on('logout', (arg, callback) => {
    const { token } = arg || {};

    isToken(token, '不是一个有效token', callback);
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    const user = userCache.findByUuid(tokenVal.uuid);
    if (user) {
      userCache.setSocketId(tokenVal.uuid, null);
      userCache.setOnline(tokenVal.uuid, 0);
      invalidateOnlineUsersCache();
    }
    logCache.addLog(
      `${tokenVal.uuid} 退出房间 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })}`
    );
    socket.leave('hall');
    broadcastUserStatusChange(io, allDB, 'hall');
    return callback({
      code: 1,
      type: 'success',
      data: {},
      message: '登出成功',
    });
  });
}
