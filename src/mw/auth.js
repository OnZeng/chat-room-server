import { verifyToken } from "../utils/index.js";

/**
 * @description http校验token
 */
export function checkToken(ctx, next) {
    const token = ctx.header.authorization
    // console.log(token);
    // 校验token格式
    const tokenRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    if (!tokenRegex.test(token)) return ctx.body = {
        status: 0,
        type: "error",
        message: "身份认证失败",
    }

    try {
        const user = verifyToken(token);
        ctx.user = user;
        next();
    } catch (error) {
        console.log('token解密失败:' + error.message);
        return ctx.body = {
            status: 0,
            type: "error",
            message: "身份认证失败",
        };
    }
}

/**
 * @description socket校验token
 */
export function checkSocketToken(token, callback) {
    try {
        const user = verifyToken(token);
        return {
            ...user,
            auto: true
        }
    } catch (error) {
        // console.log('token解密失败:' + error.message);
        callback({
            code: 0,
            type: "error",
            data: {},
            message: "身份认证失败",
        });
        return {
            user: null,
            auto: false
        };
    }
}
