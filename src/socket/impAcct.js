import { checkSocketToken, broadcastUserStatusChange, invalidateOnlineUsersCache } from '../mw/index.js';
import { isToken, isLength, isNoSpace, createToken, removePrivacyFields } from '../utils/index.js';

export default function (socket, allDB, io) {
  const { userCache, logCache, configCache } = allDB;
  socket.on('init', (arg, callback) => {
    const { name, avatar, token } = arg || {};

    isToken(token, '不是一个有效token', callback);
    isNoSpace(name, '昵称不能有空格', callback);
    isLength(name, 1, 6, '昵称需为1-6个文字或字母或数字或下划线', callback);
    isNoSpace(avatar, '头像地址不能有空格', callback);
    isLength(avatar, 1, 255, '头像地址长度必须在1到255之间', callback);
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    const user = userCache.findByUuid(tokenVal.uuid);
    if (!user) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '用户不存在',
      });
    }
    user.socketId = socket.id;
    user.name = name;
    user.avatar = avatar;
    user.online = 1;
    user.isInit = 1;
    user.device = socket.handshake.headers['user-agent'];
    user.loginTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });
    user.ip = socket.handshake.address;
    userCache.updateUser(user);
    invalidateOnlineUsersCache();
    const newToken = createToken({
      uuid: user.uuid,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    });
    logCache.addLog(
      `${user.uuid} 进入房间 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })}`
    );
    configCache.incrementConnCount();
    socket.join('hall');
    broadcastUserStatusChange(io, allDB, 'hall');
    return callback({
      code: 1,
      type: 'success',
      data: {
        user: removePrivacyFields(user),
        token: newToken,
      },
      message: '设置成功',
    });
  });
}
