import koa from 'koa';
import { koaBody } from 'koa-body';
import koaStatic from 'koa-static';
import cors from '@koa/cors';
import koaHelmet from 'koa-helmet';
import http from 'http';
import { Server } from 'socket.io';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import { prRouter, puRouter } from './routes/index.js';
import { initJsonDB } from './mw/index.js';
import { bootstrap } from './socket/index.js';

console.log('----------------------启动中----------------------');

// Socket.io 性能优化配置
const socketOptions = {
  // 允许的传输方式
  transports: ['websocket', 'polling'],
  // 心跳间隔（客户端多久发一次ping，默认25s，这里调整为更合理的值）
  pingInterval: 15000,
  // 心跳超时时间（服务端多久没收到pong就断开，默认20s）
  pingTimeout: 10000,
  // 连接超时时间
  connectTimeout: 10000,
  // 启用压缩
  perMessageDeflate: {
    threshold: 1024, // 大于1KB才压缩
  },
  // 允许的最大HTTP缓冲区大小
  maxHttpBufferSize: 1e6,
  // 跨域配置
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
};

if (process.env.SOCKET_ENABLED === 'true') {
  const app = new koa();
  app.use(historyApiFallback());
  app.use(koaStatic('dist'));
  // 初始化websocket服务
  console.log('初始化websocket服务');
  const server = http.createServer(app.callback());
  const io = new Server(server, socketOptions);
  // 初始化数据库
  const allDB = await initJsonDB();
  bootstrap(io, allDB);
  server.listen(process.env.SOCKET_PORT, () => {
    console.log(
      'websocket服务启动成功，访问地址:http://127.0.0.1:' +
        process.env.SOCKET_PORT || 3000
    );
  });
} else {
  const app = new koa();
  app.use(historyApiFallback());
  // 初始化数据库
  app.context.allDB = await initJsonDB();

  app.use(
    koaBody({
      patchNode: true,
      multipart: false,
      json: false,
      jsonStrict: true,
    })
  ); // 解析请求体
  app.use(koaHelmet()); // 安全相关中间件
  app.use(cors()); // 允许跨域
  app.use(prRouter.routes());
  app.use(puRouter.routes());

  app.listen(process.env.HTTP_PORT || 3000, () => {
    console.log(
      'http服务启动成功，访问地址:http://127.0.0.1:' + process.env.HTTP_PORT ||
        3000
    );
  });
}
