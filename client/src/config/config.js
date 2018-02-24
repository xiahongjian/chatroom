import Env from './env';

let config = {
    env: Env,
    url: Env === 'development' 
        ? 'http://localhost:8000' 
        : 'http://chatroom.hongjian.tech'
};
export default config;