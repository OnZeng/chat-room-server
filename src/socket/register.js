import { randomUUID } from 'crypto';
import { createToken, isEmail, isPassword, isLength, isNoSpace } from "../utils/index.js";

export default function (socket, allDB) {
    const { userCache, logCache } = allDB;
    socket.on('register', (arg, callback) => {
        const { email, password, cfmPassword } = arg || {};

        isEmail(email, "邮箱格式错误", callback);
        isPassword(password, "密码格式错误", callback);
        isLength(password, 6, 14, "密码长度必须在6到14之间", callback);
        isNoSpace(password, "密码不能包含空格", callback);
        isNoSpace(cfmPassword, "确认密码不能包含空格", callback);
        isLength(cfmPassword, 6, 14, "确认密码长度必须在6到14之间", callback);

        if (password !== cfmPassword) {
            return callback({
                code: 0,
                type: "error",
                data: {},
                message: "密码和确认密码不一致",
            });
        }
        const userInfo = userCache.findByEmail(email);
        if (userInfo) {
            return callback({
                code: 0,
                type: "error",
                data: {},
                message: "邮箱已存在",
            });
        }
        const newUser = {
            uuid: randomUUID(),
            socketId: null,
            email,
            password,
            name: null,
            avatar: null,
            state: 1,
            online: 0,
            device: socket.handshake.headers['user-agent'],
            regTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            regIp: socket.handshake.address,
            loginTime: null,
            ip: socket.handshake.address,
            isInit: 0,
            role: 2,
        }
        userCache.addUser(newUser);
        logCache.addLog(`${newUser.uuid} 注册 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        const newToken = createToken({ uuid: newUser.uuid, name: '00000', avatar: '', email: newUser.email });
        return callback({
            code: 1,
            type: "success",
            data: {
                token: newToken,
            },
            message: "注册成功",
        });
    })
}