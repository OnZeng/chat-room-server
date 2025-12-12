import { checkSocketToken } from "../middlewares/auth.js";
import { isToken } from "../utils/index.js";
import { broadcastToRoom } from "../middlewares/index.js";



export default function (socket, allDB) {
    const { userDB, logDB } = allDB;
    socket.on('logout', (arg, callback) => {
        const { token } = arg || {};

        isToken(token, "token格式错误", callback);
        // 验证并获取token中的用户信息
        const tokenVal = checkSocketToken(token, callback);
        // 更新用户状态为离线
        userDB.data.forEach(item => {
            if (item.uuid === tokenVal.uuid) {
                item.socketId = null
                item.online = 0;
            }
        })
        userDB.write()
        // 记录大厅日志
        logDB.data.push(`${tokenVal.uuid} 退出房间 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
        logDB.write();
        // 离开权限组
        socket.leave('hall');
        // 转发数据
        broadcastToRoom(socket, allDB, 'hall')
        return callback({
            code: 1,
            type: "success",
            data: {},
            message: '登出成功',
        })
    })
}