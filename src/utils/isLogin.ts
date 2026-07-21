import { USER_TOKEN } from './index';

function isLogin() {
    return localStorage.getItem(USER_TOKEN) !== null;
}

export default isLogin;