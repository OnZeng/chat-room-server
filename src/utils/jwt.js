import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";


/**
 * 加密属性
 */
const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32); // 32字节的随机密钥
const iv = crypto.randomBytes(16); // 16字节的随机初始向量

/**
 *
 * @description 生成token
 * @param {string} data 需要存储的信息
 * @returns {string} 返回一个字符串，表示生成的令牌
 */
export function createToken(data) {
    const token = jsonwebtoken.sign(data, process.env.TOKEN_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRES_IN,
    });
    // 生产环境加密token
    if (process.env.TOKEN_ENABLED === 'true') {
        console.log(process.env.TOKEN_ENABLED)
        return encrypt(token)
    } else {
        return token;
    }
}

/**
 * 解密token
 * @param {String} token 用户token
 * @returns {*} 返回存储的信息
 */
export function verifyToken(token) {
    // 生产环境解密token
    if (process.env.TOKEN_ENABLED === 'true') {
        console.log(Boolean(process.env.TOKEN_ENABLED))
        return jsonwebtoken.verify(decrypt(token), process.env.TOKEN_SECRET);
    } else {
        return jsonwebtoken.verify(token, process.env.TOKEN_SECRET);
    }
}

/**
 *
 * @param {string} str 需要加密的字符串
 * @returns {string} 返回一个字符串
 */
export function encrypt(str) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(str, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}

/**
 *
 * @param {string} str 需要解密的字符串
 * @returns {string} 返回一个字符串
 */
export function decrypt(str) {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(str, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
