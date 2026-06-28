import { removePrivacyFields } from '../utils/index.js';
import { MAX_MSG_COUNT, MAX_LOG_COUNT } from './dbCache.js';

let onlineUsersCache = [];
let onlineUsersDirty = true;

function buildOnlineUsers(userCache) {
  if (!onlineUsersDirty) return onlineUsersCache;
  const onlineUsers = userCache.getOnlineUsers().map(item => removePrivacyFields(item));
  onlineUsersCache = onlineUsers;
  onlineUsersDirty = false;
  return onlineUsersCache;
}

function invalidateOnlineUsersCache() {
  onlineUsersDirty = true;
}

export async function broadcastToRoom(socket, allDB, room) {
  const { userDB, userCache, msgCache, logCache, configCache } = allDB;
  const user = userCache.findBySocketId(socket.id);
  if (user === undefined) {
    return;
  }
  if (!user.name || !user.avatar) {
    userCache.removeSocketId(socket.id);
    socket.emit('init', {
      code: -2,
      type: 'error',
      data: {},
      message: '账号未完善信息，请先完善账号信息'
    });
    return;
  }
  const onlineUsers = buildOnlineUsers(userCache);
  const msgList = msgCache.getRecentMessages(MAX_MSG_COUNT);
  const logList = logCache.getRecentLogs(MAX_LOG_COUNT);
  const connCount = configCache.getConnCount();
  const data = {
    onlineUsers,
    msgList,
    logList,
    connCount
  };
  socket.to(room).emit('data', data);
  socket.emit('data', data);
}

export function broadcastNewMessage(io, allDB, room, message) {
  const { userCache, configCache } = allDB;
  const onlineUsers = buildOnlineUsers(userCache);
  const connCount = configCache.getConnCount();
  io.to(room).emit('newMessage', {
    message,
    onlineUsers,
    connCount
  });
}

export function broadcastUserStatusChange(io, allDB, room) {
  const { userCache, configCache, logCache } = allDB;
  invalidateOnlineUsersCache();
  const onlineUsers = buildOnlineUsers(userCache);
  const connCount = configCache.getConnCount();
  const logList = logCache.getRecentLogs(MAX_LOG_COUNT);
  io.to(room).emit('userStatus', {
    onlineUsers,
    logList,
    connCount
  });
}

export function getInitialData(allDB) {
  const { userCache, msgCache, logCache, configCache } = allDB;
  invalidateOnlineUsersCache();
  return {
    onlineUsers: buildOnlineUsers(userCache),
    msgList: msgCache.getRecentMessages(MAX_MSG_COUNT),
    logList: logCache.getRecentLogs(MAX_LOG_COUNT),
    connCount: configCache.getConnCount()
  };
}

export { invalidateOnlineUsersCache };
