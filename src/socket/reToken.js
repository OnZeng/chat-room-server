import { checkSocketToken, broadcastUserStatusChange, invalidateOnlineUsersCache } from '../mw/index.js';
import { isToken, createToken, removePrivacyFields } from '../utils/index.js';

// 刷新token并重连
export default function refresh(socket, allDB, io) {
  const { userCache, logCache, configCache } = allDB;
  socket.on('reToken', (arg, callback) => {
    const { token } = arg || {};
    isToken(token, '不是一个有效token', callback);
    // 验证并获取token中的用户信息
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    // 从缓存中查找用户
    const userInfo = userCache.findByUuid(tokenVal.uuid);
    if (!userInfo) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '认证已过期，请重新登录'
      });
    }
    if (userInfo.name === null || userInfo.avatar === null) {
      return callback({
        code: -2,
        type: 'error',
        data: {},
        message: '账号未完善信息，请重新登录并完善账号信息'
      });
    }
    // 账号是否在线
    if (userInfo.online === 1) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号已在其他设备登录'
      });
    }
    // 更新用户信息
    userInfo.socketId = socket.id;
    userInfo.online = 1;
    userInfo.device = socket.handshake.headers['user-agent'];
    userInfo.loginTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai'
    });
    userInfo.ip = socket.handshake.address;
    userCache.updateUser(userInfo);
    invalidateOnlineUsersCache();
    // 生成新token
    const newToken = createToken({
      uuid: userInfo.uuid,
      name: userInfo.name,
      avatar: userInfo.avatar,
      email: userInfo.email
    });
    // 记录大厅日志
    logCache.addLog(
      `${userInfo.uuid} 重新连接 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai'
      })}`
    );
    // 连接次数+1
    configCache.incrementConnCount();
    // 加入临时房间(权限组)
    socket.join('hall');
    // 转发用户状态变化
    broadcastUserStatusChange(io, allDB, 'hall');
    // 刷新成功
    return callback({
      code: 1,
      type: 'success',
      data: {
        user: removePrivacyFields(userInfo),
        token: newToken
      },
      message: '刷新成功'
    });
  });
}
