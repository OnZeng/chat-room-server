import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";

// AES加密配置
const algorithm = "aes-256-cbc";

// 从环境变量获取密钥，没有则使用固定值（生产环境应配置环境变量）
// 注意：使用随机密钥会导致服务重启后所有token失效
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'chat-room-encryption-key-32bytes!';
const ENCRYPTION_IV = process.env.TOKEN_ENCRYPTION_IV || 'chat-room-iv-16b';

// 将密钥填充到正确长度
function getKey() {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

function getIv() {
  return Buffer.from(ENCRYPTION_IV.padEnd(16, '0')).slice(0, 16);
}

// Token验证缓存（减少重复JWT验证的开销）
const tokenCache = new Map();
const TOKEN_CACHE_MAX = 500; // 最大缓存数量
const TOKEN_CACHE_TTL = 60 * 1000; // 缓存有效期1分钟

// 清理过期缓存
function cleanTokenCache() {
  const now = Date.now();
  for (const [token, data] of tokenCache) {
    if (now - data.time > TOKEN_CACHE_TTL) {
      tokenCache.delete(token);
    }
  }
}

/**
 * @description 生成token
 * @param {object} data 需要存储的信息
 * @returns {string} 返回一个字符串，表示生成的令牌
 */
export function createToken(data) {
  const token = jsonwebtoken.sign(data, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES_IN,
  });
  // 生产环境加密token
  if (process.env.TOKEN_ENABLED === 'true') {
    return encrypt(token);
  } else {
    return token;
  }
}

/**
 * @description 解密并验证token
 * @param {String} token 用户token
 * @returns {*} 返回存储的信息
 */
export function verifyToken(token) {
  // 检查缓存
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.time < TOKEN_CACHE_TTL) {
    return cached.data;
  }

  let result;
  // 生产环境解密token
  if (process.env.TOKEN_ENABLED === 'true') {
    result = jsonwebtoken.verify(decrypt(token), process.env.TOKEN_SECRET);
  } else {
    result = jsonwebtoken.verify(token, process.env.TOKEN_SECRET);
  }

  // 写入缓存
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    cleanTokenCache();
  }
  tokenCache.set(token, { data: result, time: Date.now() });

  return result;
}

/**
 * @description AES加密
 * @param {string} str 需要加密的字符串
 * @returns {string} 返回加密后的字符串
 */
export function encrypt(str) {
  const cipher = crypto.createCipheriv(algorithm, getKey(), getIv());
  let encrypted = cipher.update(str, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

/**
 * @description AES解密
 * @param {string} str 需要解密的字符串
 * @returns {string} 返回解密后的字符串
 */
export function decrypt(str) {
  const decipher = crypto.createDecipheriv(algorithm, getKey(), getIv());
  let decrypted = decipher.update(str, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
