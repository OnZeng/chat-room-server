import { checkSocketToken, broadcastToRoom } from '../mw/index.js';
import { isToken, createToken, removePrivacyFields } from '../utils/index.js';

export default function refresh(socket, allDB) {
  const { userDB, logDB, configDB } = allDB;
  socket.on('reToken', (arg, callback) => {
    const { token } = arg || {};
    isToken(token, 'token不是正确格式', callback);
    // 验证并获取token中的用户信息
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    // 当前登录用户信息
    const user = removePrivacyFields(
      userDB.data.find((item) => item.uuid === tokenVal.uuid)
    );
    if (!user.uuid) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '认证已过期，请重新登录',
      });
    }
    if (user.name === null || user.avatar === null) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号未完善信息，请重新登录并完善账号信息',
      });
    }
    // 账号是否在线
    if (user.online === 1) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号已在其他设备登录',
      });
    }
    // 更新用户信息
    userDB.data.forEach((item) => {
      if (item.uuid === tokenVal.uuid) {
        item.socketId = socket.id;
        item.online = 1;
        item.device = socket.handshake.headers['user-agent'];
        item.loginTime = new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
        });
        item.ip = socket.handshake.address;
      }
    });
    userDB.write();
    // 生成新token
    const newToken = createToken({
      uuid: user.uuid,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    });
    // 记录大厅日志
    logDB.data.push(
      `${user.uuid} 重新连接 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })}`
    );
    logDB.write();
    // 连接次数+1
    configDB.data.connCount += 1;
    configDB.write();
    // 加入临时房间(权限组)
    socket.join('hall');
    // 转发数据
    broadcastToRoom(socket, allDB, 'hall');
    // 刷新成功
    return callback({
      code: 1,
      type: 'success',
      data: {
        user,
        token: newToken,
      },
      message: '刷新成功',
    });
  });
}
