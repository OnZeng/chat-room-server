// 最大消息保留数量
const MAX_MSG_COUNT = 200;
// 最大日志保留数量
const MAX_LOG_COUNT = 200;
// 批量写入防抖时间（毫秒）
const WRITE_DEBOUNCE_MS = 500;

/**
 * @description 创建用户数据库缓存层
 *  - 使用 Map 建立索引，将查找从 O(n) 优化到 O(1)
 *  - 使用防抖批量写入，减少磁盘 I/O 次数
 * @param {object} db lowdb 数据库实例
 * @returns {object} 缓存操作方法
 */
function createDbCache(db) {
  // 用户uuid索引: uuid -> user
  const uuidIndex = new Map();
  // socketId索引: socketId -> user
  const socketIdIndex = new Map();
  // 邮箱索引: email -> user
  const emailIndex = new Map();
  // 写入定时器
  let writeTimer = null;
  // 是否有待写入的数据
  let pendingWrite = false;

  /**
   * @description 重建所有索引（初始化和数据大量变动时调用）
   */
  function rebuildIndexes() {
    uuidIndex.clear();
    socketIdIndex.clear();
    emailIndex.clear();
    for (const user of db.data) {
      uuidIndex.set(user.uuid, user);
      if (user.socketId) {
        socketIdIndex.set(user.socketId, user);
      }
      if (user.email) {
        emailIndex.set(user.email, user);
      }
    }
  }

  /**
   * @description 调度写入操作（防抖）
   * 多次连续修改只会触发一次磁盘写入
   */
  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  /**
   * @description 根据uuid查找用户
   * @param {string} uuid 用户唯一标识
   * @returns {object|undefined} 用户对象
   */
  function findByUuid(uuid) {
    return uuidIndex.get(uuid);
  }

  /**
   * @description 根据socketId查找用户
   * @param {string} socketId 连接标识
   * @returns {object|undefined} 用户对象
   */
  function findBySocketId(socketId) {
    return socketIdIndex.get(socketId);
  }

  /**
   * @description 根据邮箱查找用户
   * @param {string} email 邮箱地址
   * @returns {object|undefined} 用户对象
   */
  function findByEmail(email) {
    return emailIndex.get(email);
  }

  /**
   * @description 更新用户信息并同步索引
   * @param {object} user 用户对象
   */
  function updateUser(user) {
    if (user.socketId) {
      socketIdIndex.set(user.socketId, user);
    }
    if (user.email) {
      emailIndex.set(user.email, user);
    }
    uuidIndex.set(user.uuid, user);
    scheduleWrite();
  }

  /**
   * @description 设置用户的socketId
   * @param {string} uuid 用户唯一标识
   * @param {string|null} socketId 连接标识
   */
  function setSocketId(uuid, socketId) {
    const user = uuidIndex.get(uuid);
    if (!user) return;
    // 清除旧的socketId索引
    if (user.socketId && user.socketId !== socketId) {
      socketIdIndex.delete(user.socketId);
    }
    user.socketId = socketId;
    if (socketId) {
      socketIdIndex.set(socketId, user);
    }
    scheduleWrite();
  }

  /**
   * @description 设置用户在线状态
   * @param {string} uuid 用户唯一标识
   * @param {boolean} online 是否在线
   */
  function setOnline(uuid, online) {
    const user = uuidIndex.get(uuid);
    if (!user) return;
    user.online = online ? 1 : 0;
    scheduleWrite();
  }

  /**
   * @description 移除socketId关联并将用户置为离线
   * @param {string} socketId 连接标识
   */
  function removeSocketId(socketId) {
    const user = socketIdIndex.get(socketId);
    if (user) {
      user.socketId = null;
      user.online = 0;
      socketIdIndex.delete(socketId);
      scheduleWrite();
    }
  }

  /**
   * @description 添加新用户
   * @param {object} user 用户对象
   */
  function addUser(user) {
    db.data.push(user);
    uuidIndex.set(user.uuid, user);
    if (user.email) {
      emailIndex.set(user.email, user);
    }
    if (user.socketId) {
      socketIdIndex.set(user.socketId, user);
    }
    scheduleWrite();
  }

  /**
   * @description 获取所有在线用户列表
   * @returns {array} 在线用户数组
   */
  function getOnlineUsers() {
    const result = [];
    for (const user of db.data) {
      if (user.online === 1) {
        result.push(user);
      }
    }
    return result;
  }

  /**
   * @description 立即将待写入数据刷新到磁盘
   * @returns {Promise}
   */
  function flushWrite() {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
    if (pendingWrite) {
      pendingWrite = false;
      return db.write();
    }
    return Promise.resolve();
  }

  // 初始化时重建索引
  rebuildIndexes();

  return {
    findByUuid,
    findBySocketId,
    findByEmail,
    updateUser,
    setSocketId,
    setOnline,
    removeSocketId,
    addUser,
    getOnlineUsers,
    flushWrite,
    scheduleWrite,
    rebuildIndexes,
  };
}

/**
 * @description 创建消息数据库缓存层
 *  - 限制内存中消息数量，避免无限增长
 *  - 使用防抖批量写入
 * @param {object} db lowdb 数据库实例
 * @returns {object} 缓存操作方法
 */
function createMsgCache(db) {
  let writeTimer = null;
  let pendingWrite = false;

  /**
   * @description 调度写入操作（防抖）
   */
  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      // 写入前裁剪消息数量
      if (db.data.length > MAX_MSG_COUNT) {
        db.data = db.data.slice(db.data.length - MAX_MSG_COUNT);
      }
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  /**
   * @description 添加新消息
   * @param {object} msg 消息对象
   * @returns {object} 消息对象
   */
  function addMessage(msg) {
    db.data.push(msg);
    // 内存中消息过多时裁剪（宽松阈值，避免频繁裁剪）
    if (db.data.length > MAX_MSG_COUNT * 2) {
      db.data = db.data.slice(db.data.length - MAX_MSG_COUNT);
    }
    scheduleWrite();
    return msg;
  }

  /**
   * @description 获取最近的消息
   * @param {number} count 获取数量，默认最大保留数
   * @returns {array} 消息数组
   */
  function getRecentMessages(count = MAX_MSG_COUNT) {
    const start = Math.max(0, db.data.length - count);
    return db.data.slice(start);
  }

  /**
   * @description 立即将待写入数据刷新到磁盘
   * @returns {Promise}
   */
  function flushWrite() {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
    if (pendingWrite) {
      pendingWrite = false;
      if (db.data.length > MAX_MSG_COUNT) {
        db.data = db.data.slice(db.data.length - MAX_MSG_COUNT);
      }
      return db.write();
    }
    return Promise.resolve();
  }

  return {
    addMessage,
    getRecentMessages,
    flushWrite,
    scheduleWrite,
  };
}

/**
 * @description 创建日志数据库缓存层
 *  - 限制内存中日志数量
 *  - 使用防抖批量写入
 * @param {object} db lowdb 数据库实例
 * @returns {object} 缓存操作方法
 */
function createLogCache(db) {
  let writeTimer = null;
  let pendingWrite = false;

  /**
   * @description 调度写入操作（防抖）
   */
  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      if (db.data.length > MAX_LOG_COUNT) {
        db.data = db.data.slice(db.data.length - MAX_LOG_COUNT);
      }
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  /**
   * @description 添加新日志
   * @param {string} log 日志内容
   */
  function addLog(log) {
    db.data.push(log);
    if (db.data.length > MAX_LOG_COUNT * 2) {
      db.data = db.data.slice(db.data.length - MAX_LOG_COUNT);
    }
    scheduleWrite();
  }

  /**
   * @description 获取最近的日志
   * @param {number} count 获取数量
   * @returns {array} 日志数组
   */
  function getRecentLogs(count = MAX_LOG_COUNT) {
    const start = Math.max(0, db.data.length - count);
    return db.data.slice(start);
  }

  /**
   * @description 立即将待写入数据刷新到磁盘
   * @returns {Promise}
   */
  function flushWrite() {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
    if (pendingWrite) {
      pendingWrite = false;
      if (db.data.length > MAX_LOG_COUNT) {
        db.data = db.data.slice(db.data.length - MAX_LOG_COUNT);
      }
      return db.write();
    }
    return Promise.resolve();
  }

  return {
    addLog,
    getRecentLogs,
    flushWrite,
    scheduleWrite,
  };
}

/**
 * @description 创建配置数据库缓存层
 *  - 使用防抖批量写入
 * @param {object} db lowdb 数据库实例
 * @returns {object} 缓存操作方法
 */
function createConfigCache(db) {
  let writeTimer = null;
  let pendingWrite = false;

  /**
   * @description 调度写入操作（防抖）
   */
  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  /**
   * @description 连接计数+1
   * @returns {number} 当前连接计数
   */
  function incrementConnCount() {
    db.data.connCount += 1;
    scheduleWrite();
    return db.data.connCount;
  }

  /**
   * @description 获取连接计数
   * @returns {number} 连接计数
   */
  function getConnCount() {
    return db.data.connCount;
  }

  /**
   * @description 立即将待写入数据刷新到磁盘
   * @returns {Promise}
   */
  function flushWrite() {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
    if (pendingWrite) {
      pendingWrite = false;
      return db.write();
    }
    return Promise.resolve();
  }

  return {
    incrementConnCount,
    getConnCount,
    flushWrite,
    scheduleWrite,
  };
}

export { createDbCache, createMsgCache, createLogCache, createConfigCache, MAX_MSG_COUNT, MAX_LOG_COUNT };
