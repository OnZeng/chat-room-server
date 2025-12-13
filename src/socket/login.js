import {
  createToken,
  removePrivacyFields,
  isEmail,
  isPassword,
} from '../utils/index.js';
import { broadcastToRoom } from '../mw/index.js';

export default function login(socket, allDB) {
  const { userDB, logDB, configDB } = allDB;
  socket.on('login', (arg, callback) => {
    const { email, password } = arg || {};

    isEmail(email, '邮箱格式错误', callback);
    isPassword(password, '密码格式错误', callback);
    // 验证用户名和密码是否正确
    const oneInfo = userDB.data.find(
      (item) => item.email === email && item.password === password
    );
    if (!oneInfo) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号或密码错误',
      });
    }
    // 账号是否停用
    if (oneInfo.state === 0) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号已停用，请联系管理员',
      });
    }
    // 账号是否已在线
    if (oneInfo.online === 1) {
      return callback({
        code: 0,
        type: 'error',
        data: {},
        message: '账号已在其他应用程序上登录，请先登出',
      });
    }
    // 生成新token
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
    // 修改当前用户属性
    userDB.data.forEach((item) => {
      if (item.uuid === oneInfo.uuid) {
        // 存储会话id
        item.socketId = socket.id;
        // 在线状态
        item.online = 1;
        // 设备类型
        item.device = socket.handshake.headers['user-agent'];
        // 登录ip
        item.ip = socket.handshake.address;
        // 登录时间
        item.loginTime = new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
        });
        // 注册ip
        if (item.regIp === null) {
          item.regIp = socket.handshake.address;
        }
        // 注册时间
        if (item.regTime === null) {
          item.regTime = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
          });
        }
      }
    });
    userDB.write();
    // 当前登录用户(删除部分隐私字段)
    const user = removePrivacyFields(oneInfo);
    // 记录大厅日志
    logDB.data.push(
      `${user.uuid} 进入房间 ${new Date().toLocaleString('zh-CN', {
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
