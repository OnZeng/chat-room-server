import { removePrivacyFields } from '../utils/index.js';
import { MAX_MSG_COUNT, MAX_LOG_COUNT } from './dbCache.js';

// 在线用户缓存
let onlineUsersCache = [];
// 缓存是否脏（需要重新计算）
let onlineUsersDirty = true;

/**
 * @description 构建在线用户列表（带缓存）
 *  - 只有用户状态变化时才重新计算
 *  - 避免每次广播都遍历所有用户并过滤隐私字段
 * @param {object} userCache 用户缓存实例
 * @returns {array} 在线用户列表（已移除隐私字段）
 */
function buildOnlineUsers(userCache) {
  if (!onlineUsersDirty) return onlineUsersCache;
  const onlineUsers = userCache.getOnlineUsers().map(item => removePrivacyFields(item));
  onlineUsersCache = onlineUsers;
  onlineUsersDirty = false;
  return onlineUsersCache;
}

/**
 * @description 使在线用户缓存失效
 * 用户上线/下线/状态变化时调用
 */
function invalidateOnlineUsersCache() {
  onlineUsersDirty = true;
}

/**
 * @description 向指定房间广播全量数据（保持向后兼容）
 * @param {object} socket socket实例
 * @param {object} allDB 所有数据库实例
 * @param {string} room 房间名
 */
export async function broadcastToRoom(socket, allDB, room) {
  const { userDB, userCache, msgCache, logCache, configCache } = allDB;
  const user = userCache.findBySocketId(socket.id);
  if (user === undefined) {
    return;
  }
  if (!user.name || !user.avatar) {
    // 用户未完善信息，断开连接
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

/**
 * @description 广播新消息（增量推送，性能更好）
 *  - 只推送单条新消息，而不是全量消息列表
 *  - 大幅减少网络传输数据量
 * @param {object} io socket.io实例
 * @param {object} allDB 所有数据库实例
 * @param {string} room 房间名
 * @param {object} message 消息对象
 */
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

/**
 * @description 广播用户状态变化（用户上线/下线时调用）
 *  - 只推送在线用户列表和日志，不推送全部消息
 * @param {object} io socket.io实例
 * @param {object} allDB 所有数据库实例
 * @param {string} room 房间名
 */
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

/**
 * @description 获取初始数据（用户首次进入房间时调用）
 * @param {object} allDB 所有数据库实例
 * @returns {object} 初始数据
 */
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
