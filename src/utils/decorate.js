// 转发时移除用户信息中的隐私字段
export function removePrivacyFields(user) {
    const userCopy = { ...user };
    delete userCopy.socketId;
    delete userCopy.email;
    delete userCopy.password;
    delete userCopy.device;
    delete userCopy.regTime;
    delete userCopy.regIp;
    delete userCopy.loginTime;
    delete userCopy.ip;
    return userCopy;
}
