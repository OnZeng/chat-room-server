import { JSONFilePreset } from 'lowdb/node';
import { randomUUID } from 'crypto';
import { exists } from '../utils/index.js';
import fs from 'fs/promises';

// 初始化数据库
export async function initJsonDB() {
  // 用户表默认数据
  const defaultUser = {
    uuid: randomUUID(), // 唯一id
    socketId: null, // 会话id
    email: '123456@qq.com', // 邮箱
    password: '123456', // 密码
    name: '', // 昵称
    avatar: '', // 头像
    state: 1, // 账号状态 0：停用 1：正常
    online: 0, // 是否在线 0：否 1：是
    device: '', // 设备类型
    regTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }), // 注册时间
    regIp: null, // 注册ip
    loginTime: null, // 登录时间
    ip: null, // 登录ip
    isInit: 0, // 是否初始化 0：否 1：是 初始化后不能再初始化
    role: 1 // 1：管理员 2：普通用户
  };
  console.log('正在初始化数据库');
  // 判断文件夹是否存在，不存在则创建
  if (!(await exists('./src/data'))) {
    await fs.mkdir('./src/data');
    console.log('正在创建数据文件夹');
    console.log('正在初始化用户表');
    console.log('正在初始化聊天表');
    console.log('正在初始化日志表');
  }
  const userDB = await JSONFilePreset('./src/data/user.json', [defaultUser]);
  const msgDB = await JSONFilePreset('./src/data/msg.json', []);
  const logDB = await JSONFilePreset('./src/data/log.json', []);
  const configDB = await JSONFilePreset('./src/data/config.json', {
    // 连接次数
    connCount: 0
  });
  await userDB.read();
  await userDB.write();
  await msgDB.read();
  await msgDB.write();
  await logDB.read();
  await logDB.write();
  await configDB.read();
  await configDB.write();
  // 启动服务端强制下线所有用户
  await userDB.data.forEach(item => (item.online = 0));
  await userDB.write();
  console.log('数据加载完成');
  return {
    userDB,
    msgDB,
    logDB,
    configDB
  };
}
