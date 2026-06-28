const MAX_MSG_COUNT = 200;
const MAX_LOG_COUNT = 200;
const WRITE_DEBOUNCE_MS = 500;

function createDbCache(db) {
  const uuidIndex = new Map();
  const socketIdIndex = new Map();
  const emailIndex = new Map();
  let writeTimer = null;
  let pendingWrite = false;

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

  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  function findByUuid(uuid) {
    return uuidIndex.get(uuid);
  }

  function findBySocketId(socketId) {
    return socketIdIndex.get(socketId);
  }

  function findByEmail(email) {
    return emailIndex.get(email);
  }

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

  function setSocketId(uuid, socketId) {
    const user = uuidIndex.get(uuid);
    if (!user) return;
    if (user.socketId && user.socketId !== socketId) {
      socketIdIndex.delete(user.socketId);
    }
    user.socketId = socketId;
    if (socketId) {
      socketIdIndex.set(socketId, user);
    }
    scheduleWrite();
  }

  function setOnline(uuid, online) {
    const user = uuidIndex.get(uuid);
    if (!user) return;
    user.online = online ? 1 : 0;
    scheduleWrite();
  }

  function removeSocketId(socketId) {
    const user = socketIdIndex.get(socketId);
    if (user) {
      user.socketId = null;
      user.online = 0;
      socketIdIndex.delete(socketId);
      scheduleWrite();
    }
  }

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

  function getOnlineUsers() {
    const result = [];
    for (const user of db.data) {
      if (user.online === 1) {
        result.push(user);
      }
    }
    return result;
  }

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

function createMsgCache(db) {
  let writeTimer = null;
  let pendingWrite = false;

  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      if (db.data.length > MAX_MSG_COUNT) {
        db.data = db.data.slice(db.data.length - MAX_MSG_COUNT);
      }
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  function addMessage(msg) {
    db.data.push(msg);
    if (db.data.length > MAX_MSG_COUNT * 2) {
      db.data = db.data.slice(db.data.length - MAX_MSG_COUNT);
    }
    scheduleWrite();
    return msg;
  }

  function getRecentMessages(count = MAX_MSG_COUNT) {
    const start = Math.max(0, db.data.length - count);
    return db.data.slice(start);
  }

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

function createLogCache(db) {
  let writeTimer = null;
  let pendingWrite = false;

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

  function addLog(log) {
    db.data.push(log);
    if (db.data.length > MAX_LOG_COUNT * 2) {
      db.data = db.data.slice(db.data.length - MAX_LOG_COUNT);
    }
    scheduleWrite();
  }

  function getRecentLogs(count = MAX_LOG_COUNT) {
    const start = Math.max(0, db.data.length - count);
    return db.data.slice(start);
  }

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

function createConfigCache(db) {
  let writeTimer = null;
  let pendingWrite = false;

  function scheduleWrite() {
    if (writeTimer) return;
    pendingWrite = true;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      pendingWrite = false;
      db.write().catch(console.error);
    }, WRITE_DEBOUNCE_MS);
  }

  function incrementConnCount() {
    db.data.connCount += 1;
    scheduleWrite();
    return db.data.connCount;
  }

  function getConnCount() {
    return db.data.connCount;
  }

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
