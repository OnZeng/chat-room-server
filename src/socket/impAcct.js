import { checkSocketToken, broadcastToRoom } from '../mw/index.js';
import { isToken, isLength, isNoSpace, createToken } from '../utils/index.js';

export default function (socket, allDB) {
  const { userDB, logDB, configDB } = allDB;
  socket.on('init', (arg, callback) => {
    const { name, avatar, token } = arg || {};

    isToken(token, '不是一个有效token', callback);
    isNoSpace(name, '昵称不能有空格', callback);
    isLength(name, 1, 6, '昵称需为1-6个文字或字母或数字或下划线', callback);
    isNoSpace(avatar, '头像地址不能有空格', callback);
    isLength(avatar, 1, 255, '头像地址长度必须在1到255之间', callback);
    // 验证并获取token中的用户信息
    const tokenVal = checkSocketToken(token, callback);
    if (!tokenVal.auto) {
      return;
    }
    // 更新用户信息
    userDB.data.forEach((item) => {
      if (item.uuid === tokenVal.uuid) {
        item.socketId = socket.id;
        item.name = name;
        item.avatar = avatar;
        item.online = 1;
        item.isInit = 1;
        item.device = socket.handshake.headers['user-agent'];
        item.loginTime = new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
        });
        item.ip = socket.handshake.address;
      }
    });
    userDB.write();
    // 当前用户信息
    const user = userDB.data.find((item) => item.uuid === tokenVal.uuid);
    // 生成新token
    const newToken = createToken({
      uuid: user.uuid,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
    });
    logDB.data.push(
      `${user.uuid} 进入房间 ${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })}`
    );
    logDB.write();
    // 连接次数+1
    configDB.data.connCount += 1;
    configDB.write();
    // 加入权限组
    socket.join('hall');
    // 转发数据
    broadcastToRoom(socket, allDB, 'hall');
    return callback({
      code: 1,
      type: 'success',
      data: {
        user,
        token: newToken,
      },
      message: '设置成功',
    });
  });
}
