import router from "koa-router";
import { createToken } from "../utils/jwt.js";

/**
 * @description 公共路由(无需token校验)
 */
export const puRouter = new router();

// 公共路由前缀
puRouter.prefix("/api");

puRouter.post("/login", async ctx => {
    const { userDB } = ctx.allDB
    const { email, password } = ctx.req.body || {};
    if (!email || !password) {
        ctx.status = 400;
        ctx.body = { error: "用户名或密码不能为空" };
        return;
    }
    // 校验用户名密码
    const userInfo = userDB.data.find(item => item.email === email && item.password === password);
    if (!userInfo) {
        ctx.body = {
            status: 0,
            type: "error",
            message: "账号或密码错误",
        }
        return;
    }
    const token = createToken({ id: userInfo.id });
    ctx.body = {
        email: userInfo.email,
        name: userInfo.name,
        token
    };
})