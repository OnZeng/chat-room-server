import login from './login.js';
import register from './register.js';
import setuser from './init.js';
import refresh from './reToken.js';
import logout from './logout.js';
import sendMsg from './sendMsg.js';
import disconnect from './disconnect.js';
import version from './version.js';

export function bootstrap(io, allDB) {
    try {
        io.on('connection', (socket) => {
            // console.log(`用户${socket.id}连接客户端`);
            // 推送更新
            version(socket);
            // 登录
            login(socket, allDB);
            // 登出
            logout(socket, allDB);
            // 注册
            register(socket, allDB);
            // 初始化用户信息并登录
            setuser(socket, allDB);
            // 免登录刷新令牌
            refresh(socket, allDB);
            // 发送消息
            sendMsg(socket, allDB);
            // 断开连接
            disconnect(socket, allDB);
        });
    }
    catch (err) {
        console.log('服务器异常');
        return
    }
}