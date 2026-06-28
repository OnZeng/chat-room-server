import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:3000';
const testResults = [];

function test(name, fn) {
  return new Promise((resolve) => {
    fn().then(() => {
      testResults.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
      resolve();
    }).catch((err) => {
      testResults.push({ name, status: 'FAIL', error: err.message });
      console.log(`❌ ${name}: ${err.message}`);
      resolve();
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('========== 服务端功能测试 ==========\n');
  
  const socket = io(SOCKET_URL, { transports: ['websocket'] });
  
  await test('Socket 连接', () => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('连接超时')), 5000);
    socket.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(new Error('连接错误: ' + err.message));
    });
  }));

  let versionReceived = false;
  socket.on('version', (v) => {
    versionReceived = true;
  });

  await test('版本推送', async () => {
    await delay(500);
    if (!versionReceived) throw new Error('未收到版本信息');
  });

  const testEmail = `test_${Date.now()}@qq.com`;
  const testPassword = '123456';
  let registerToken = null;

  await test('注册功能', () => new Promise((resolve, reject) => {
    socket.emit('register', {
      email: testEmail,
      password: testPassword,
      cfmPassword: testPassword
    }, (res) => {
      if (res.code === 1 && res.data.token) {
        registerToken = res.data.token;
        resolve();
      } else {
        reject(new Error(res.message));
      }
    });
  }));

  await test('重复注册检测', () => new Promise((resolve, reject) => {
    socket.emit('register', {
      email: testEmail,
      password: testPassword,
      cfmPassword: testPassword
    }, (res) => {
      if (res.code === 0 && res.message === '邮箱已存在') {
        resolve();
      } else {
        reject(new Error('应该提示邮箱已存在'));
      }
    });
  }));

  let userInfo = null;
  let initToken = null;
  let userStatusReceived = false;

  socket.on('userStatus', (data) => {
    userStatusReceived = true;
  });

  await test('初始化账号并上线', () => new Promise((resolve, reject) => {
    socket.emit('init', {
      name: '测试用户',
      avatar: 'https://example.com/avatar.png',
      token: registerToken
    }, (res) => {
      if (res.code === 1 && res.data.user && res.data.token) {
        userInfo = res.data.user;
        initToken = res.data.token;
        setTimeout(() => {
          if (userStatusReceived) {
            resolve();
          } else {
            reject(new Error('未收到用户上线状态通知'));
          }
        }, 500);
      } else {
        reject(new Error(res.message));
      }
    });
  }));

  let receivedMessage = null;
  socket.on('newMessage', (data) => {
    receivedMessage = data.message;
  });

  await test('发送消息并收到增量推送', () => new Promise((resolve, reject) => {
    const testMsg = '测试消息内容-' + Date.now();
    socket.emit('sendMsg', {
      content: testMsg,
      token: initToken
    }, (res) => {
      if (res.code !== 1) {
        reject(new Error('发送失败: ' + res.message));
        return;
      }
      setTimeout(() => {
        if (receivedMessage && receivedMessage.content === testMsg) {
          resolve();
        } else {
          reject(new Error('增量消息推送不正确'));
        }
      }, 500);
    });
  }));

  await test('ping 心跳检测', () => new Promise((resolve, reject) => {
    socket.emit('ping', () => {
      resolve();
    });
    setTimeout(() => reject(new Error('超时')), 2000);
  }));

  await test('登出功能', () => new Promise((resolve, reject) => {
    socket.emit('logout', { token: initToken }, (res) => {
      if (res.code === 1) {
        resolve();
      } else {
        reject(new Error(res.message));
      }
    });
  }));

  await test('断线重连(token刷新)', () => new Promise((resolve, reject) => {
    const socket2 = io(SOCKET_URL, { transports: ['websocket'] });
    const timeout = setTimeout(() => reject(new Error('连接超时')), 5000);
    socket2.on('connect', () => {
      clearTimeout(timeout);
      socket2.emit('reToken', { token: initToken }, (res) => {
        socket2.disconnect();
        if (res.code === 1 && res.data.token) {
          resolve();
        } else {
          reject(new Error(res.message));
        }
      });
    });
  }));

  await test('默认管理员账号登录', () => new Promise((resolve, reject) => {
    const socket2 = io(SOCKET_URL, { transports: ['websocket'] });
    const timeout = setTimeout(() => reject(new Error('连接超时')), 5000);
    socket2.on('connect', () => {
      clearTimeout(timeout);
      socket2.emit('login', {
        email: '123456@qq.com',
        password: '123456'
      }, (res) => {
        socket2.disconnect();
        if (res.code === 2) {
          resolve();
        } else {
          reject(new Error(res.message + ' (code=' + res.code + ')'));
        }
      });
    });
  }));

  await test('密码错误检测', () => new Promise((resolve, reject) => {
    const socket2 = io(SOCKET_URL, { transports: ['websocket'] });
    const timeout = setTimeout(() => reject(new Error('连接超时')), 5000);
    socket2.on('connect', () => {
      clearTimeout(timeout);
      socket2.emit('login', {
        email: '123456@qq.com',
        password: 'wrongpassword'
      }, (res) => {
        socket2.disconnect();
        if (res.code === 0 && res.message === '账号或密码错误') {
          resolve();
        } else {
          reject(new Error('应该提示账号或密码错误'));
        }
      });
    });
  }));

  await test('获取初始数据接口', () => new Promise((resolve, reject) => {
    socket.emit('getInitialData', (res) => {
      if (res.code === 1 && res.data.onlineUsers !== undefined) {
        resolve();
      } else {
        reject(new Error(res.message || '返回数据格式不正确'));
      }
    });
    setTimeout(() => reject(new Error('超时')), 2000);
  }));

  socket.disconnect();

  console.log('\n========== 测试结果汇总 ==========');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  console.log(`通过: ${passed} / ${testResults.length}`);
  console.log(`失败: ${failed}`);
  
  if (failed > 0) {
    console.log('\n失败的测试:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n测试完成!');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('测试异常:', err);
  process.exit(1);
});
