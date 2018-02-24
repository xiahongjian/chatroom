let express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    log4js = require('log4js'),
    config = require('./config/config');

log4js.configure({
    appenders: {
        app: {
            type: 'dateFile',
            filename: './logs/remote-clipboard',
            allwaysIncludePattern: true,
            pattern: '-yyyy-MM-dd.log',
            encoding: 'utf-8',
            maxLogSize: 10
        },
        appConsole: {
            type: 'console'
        }
    },
    categories: {
        default: {
            appenders: ['app', 'appConsole'],
            level: 'all'
        }
    }
});

let logger = log4js.getLogger('appConsole');


app.use(express.static('public'));


app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/clipboard.html');
});

const EVENTS = {
    connection: 'connection',
    in: 'in',
    join: 'join',
    disconnect: 'disconnect',
    message: 'message',
    users: 'users',
    modifyNick: 'modifyNick',
    notify: 'notify'
};
const users = [];
let seq = 0;
io.on(EVENTS.connection, (socket) => {
    logger.info(`${getClientIp(socket)}[conncted]`);
    // 发送连接成功信号
    socket.emit(EVENTS.connection);
    // 加入聊天
    socket.on(EVENTS.join, (nick) => {
        socket.user = {
            id: seq++,
            nick: nick
        };
        users.push(socket.user);
        // 向客户端发送自己的id
        socket.emit(EVENTS.join, socket.user.id);
        // 向客所有户端发送当前房间成员
        io.emit(EVENTS.users, JSON.stringify(users));
        // 向其他用户广播新成员的加入
        socket.broadcast.emit(EVENTS.notify, JSON.stringify({title: '加入聊天', content: `${nick}`}));
    });

    // 修改昵称
    socket.on(EVENTS.modifyNick, (nick) => {
        for (let i = 0; i < users.length; i++) {
            if (users[i].id == socket.user.id) {
                socket.broadcast.emit(EVENTS.notify, JSON.stringify({title: '昵称修改', content: `${socket.user.nick} ==> ${nick}`}));
                users[i].nick = nick;
                socket.user.nick = nick;
                break;
            }
        }
        io.emit(EVENTS.users, JSON.stringify(users));
    });


    // 断开连接
    socket.on(EVENTS.disconnect, () => {
        let index = -1;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id == socket.user.id) {
                index = i;
                break;
            }
        }
        if (index != -1)
            users.splice(index, 1);
        if (socket.user) {
            io.emit(EVENTS.notify, JSON.stringify({title: '离开', content: `${socket.user.nick}离开聊天室`}));
        }
	    io.emit(EVENTS.users, JSON.stringify(users));
        // logger.info(`${socket.user.nick}-${getClientIp(socket)}[disconnected]`);
    });

    // 发送消息
    socket.on(EVENTS.message, msg => {
        logger.info(`${socket.user.nick}-${getClientIp(socket)}[send]:${msg}`);
        io.emit(EVENTS.message, msg);
    });
});

function getClientIp(socket) {
    return socket.handshake.headers['x-forwarded-for'] 
        || socket.conn.remoteAddress;
}
server.listen(config.port, () => {
    logger.info(`listening on ${config.port}`);
});