import {
  createToken,
  removePrivacyFields,
  isEmail,
  isPassword,
} from '../utils/index.js';
import { broadcastToRoom, broadcastUserStatusChange, invalidateOnlineUsersCache } from '../mw/index.js';

export default function login(socket, allDB, io) {
  const { userCache, logCache, configCache } = allDB;
  socket.on('login', (arg, callback) => {
    const { email, password } = arg || {};

    isEmail(email, '邮箱格式错误', callback);
    isPassword(password, '密码格式错误', callback);
    const oneInfo = userCache.findByEmail(email);
    if (!oneInfo || oneInfo.password !== password) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号或密码错误',
      });
    }
    if (oneInfo.state === 0) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号已停用，请联系管理员',
      });
    }
    if (oneInfo.online === 1) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号已在其他应用程序上登录，请先登出',
      });
    }
    const newToken = createToken({
      uuid: oneInfo.uuid,
      name: oneInfo.name,
      avatar: oneInfo.avatar,
      email: oneInfo.email,
    });
    if (oneInfo.isInit === 0) {
      return callback({
        code: 2,
        type: 'success',
        data: {
          token: newToken,
        },
        message: '账号未初始化，请先初始化账号',
      });
    }
    oneInfo.socketId = socket.id;
    oneInfo.online = 1;
    oneInfo.device = socket.handshake.headers['user-agent'];
    oneInfo.ip = socket.handshake.address;
    oneInfo.loginTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });
    if (oneInfo.regIp === null) {
      oneInfo.regIp = socket.handshake.address;
    }
    if (oneInfo.regTime === null) {
      oneInfo.regTime = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      });
    }
    userCache.updateUser(oneInfo);
    invalidateOnlineUsersCache();
    const user = removePrivacyFields(oneInfo);
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
        user,
        token: newToken,
      },
      message: '登录成功',
    });
  });
}
