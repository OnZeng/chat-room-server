import { access, constants } from 'fs/promises';

// 检查路径是否存在
export async function exists(path) {
    try {
        await access(path, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}