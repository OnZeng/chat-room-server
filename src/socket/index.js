import login from './login.js';
import register from './register.js';
import accInit from './impAcct.js';
import refresh from './reToken.js';
import logout from './logout.js';
import sendMsg from './sendMsg.js';
import disconnect from './disconnect.js';
import version from './version.js';
import ping from './ping.js';
import { getInitialData } from '../mw/index.js';

export function bootstrap(io, allDB) {
  io.on('connection', (socket) => {
    version(socket);
    ping(socket, allDB);
    login(socket, allDB, io);
    logout(socket, allDB, io);
    register(socket, allDB);
    accInit(socket, allDB, io);
    refresh(socket, allDB);
    sendMsg(socket, allDB, io);
    disconnect(socket, allDB, io);

    socket.on('getInitialData', (callback) => {
      if (typeof callback === 'function') {
        callback({
          code: 1,
          type: 'success',
          data: getInitialData(allDB),
          message: '获取成功'
        });
      }
    });
  });
}
