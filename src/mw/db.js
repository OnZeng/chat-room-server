import { JSONFilePreset } from 'lowdb/node';
import { randomUUID } from 'crypto';
import { exists } from '../utils/index.js';
import fs from 'fs/promises';
import { createDbCache, createMsgCache, createLogCache, createConfigCache } from './dbCache.js';

export async function initJsonDB() {
  const defaultUser = {
    uuid: randomUUID(),
    socketId: null,
    email: '123456@qq.com',
    password: '123456',
    name: '',
    avatar: '',
    state: 1,
    online: 0,
    device: '',
    regTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    regIp: null,
    loginTime: null,
    ip: null,
    isInit: 0,
    role: 1
  };
  console.log('正在初始化数据库');
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

  for (const item of userDB.data) {
    item.online = 0;
    item.socketId = null;
  }
  await userDB.write();

  const userCache = createDbCache(userDB);
  const msgCache = createMsgCache(msgDB);
  const logCache = createLogCache(logDB);
  const configCache = createConfigCache(configDB);

  console.log('数据加载完成');
  return {
    userDB,
    msgDB,
    logDB,
    configDB,
    userCache,
    msgCache,
    logCache,
    configCache
  };
}
