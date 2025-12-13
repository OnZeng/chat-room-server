import router from "koa-router";
import { checkToken } from "../mw/index.js";

/**
 * @description 私有路由(无需token校验)
 */
export const prRouter = new router();

// 私有路由前缀
prRouter.prefix("/api");
// 校验token
prRouter.use(checkToken);

// 查询用户信息
prRouter.get("/user", async ctx => {
    const { userDB } = ctx.allDB
    // console.log(userDB.data.filter(item => item.id === 1))
    ctx.body = "这是一个私有路由接口";
})