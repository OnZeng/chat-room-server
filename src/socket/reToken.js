import { checkSocketToken } from "../middlewares/auth.js";
import { isToken, createToken, removePrivacyFields } from "../utils/index.js";
import { broadcastToRoom } from "../middlewares/index.js";

export default function refresh(socket, allDB) {
    const { userDB, msgDB, logDB } = allDB;
    socket.on('reToken', (arg, callback) => {
        const { token } = arg || {}
        isToken(token, 'token不是正确格式', callback);
        // 验证并获取token中的用户信息
        const tokenVal = checkSocketToken(token, callback);
        // 更新用户信息
        userDB.data.forEach(item => {
            if (item.uuid === tokenVal.uuid) {
                item.socketId = socket.id;
                item.online = 1;
                item.device = socket.handshake.headers['user-agent'];
                item.loginTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
                item.ip = socket.handshake.address;
            }
        })
        userDB.write();
        // 当前登录用户信息
        const user = removePrivacyFields(userDB.data.find(item => item.uuid === tokenVal.uuid));
        // 查找当前在线用户
        const onlineUsers = userDB.data.filter(item => item.online === 1).map(item => removePrivacyFields(item));;
        // 大厅聊天记录
        const msgList = msgDB.data.map(item => item);
        // 生成新token
        const newToken = createToken({ uuid: user.uuid, email: user.email });
        // 记录大厅日志
        logDB.data.push(`${user.uuid} 重新连接 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
        logDB.write();
        // 加入临时房间(权限组)
        socket.join('hall');
        // 转发数据
        broadcastToRoom(socket, allDB, 'hall')
        // 刷新成功
        return callback({
            code: 1,
            type: "success",
            data: {
                user,
                token: newToken,
            },
            message: "刷新成功",
        })

    })
}