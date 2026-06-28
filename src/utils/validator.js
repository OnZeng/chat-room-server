// 校验字符串是否为邮箱格式
export function isEmail(str, msg, callback) {
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@(?:gmail|qq|163|126|sina|sohu|hotmail|outlook|yahoo|foxmail)\.(?:com|com\.cn|net|cn|org)$/i;
  if (!emailRegex.test(str)) {
    return callback({
      code: 0,
      type: 'error',
      data: {},
      message: msg || '邮箱格式错误'
    });
  }
  return true;
}

// 校验字符串是否为密码格式
export function isPassword(str, msg, callback) {
  const passwordRegex = /^[-A-Za-z0-9_!@#$%^&*()+=\\[\]{}|;:'",.<>/?]{6,14}$/;
  if (!passwordRegex.test(str)) {
    return callback({
      code: 0,
      type: 'error',
      data: {},
      message: msg || '密码格式错误'
    });
  }
  return true;
}

// 校验字符串是否为指定长度
export function isLength(str, min, max, msg, callback) {
  if (str.length < min || str.length > max) {
    return callback({
      code: 0,
      type: 'error',
      data: {},
      message: msg || `字符串长度必须在${min}到${max}之间`
    });
  }
  return true;
}

// 效验字符串是否有空格
export function isNoSpace(str, msg, callback) {
  if (str.includes(' ')) {
    return callback({
      code: 0,
      type: 'error',
      data: {},
      message: msg || '字符串不能包含空格'
    });
  }
  return true;
}

// 校验字符串格式是否为token
export function isToken(str, msg, callback) {
  const tokenRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  if (!tokenRegex.test(str)) {
    return callback({
      code: -10,
      type: 'error',
      data: {},
      message: msg || 'token格式错误'
    });
  }
  return true;
}
