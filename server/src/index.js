const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const app = require('./app');
const logger = require('./logger');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.join(userId);
        console.info(`🟢 User ${userId} connected to their private room.`);
    }
});

const redisSub = new Redis(process.env.REDIS_URL);
redisSub.subscribe('vinted-drops', 'vinted-system');

redisSub.on('message', (channel, message) => {
    const payload = JSON.parse(message);

    if (channel === 'vinted-drops') {
        io.to(payload.userId).emit('new-item', payload.item);
    } else if (channel === 'vinted-system') {
        io.to(payload.userId).emit('system-event', payload);
    }
});

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (error) => {
    logger.error(error, 'Uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error(reason, 'Unhandled promise rejection');
});

redisSub.on('error', (err) => logger.error(err, 'Redis subscriber error'));

server.on('error', (err) => logger.error(err, 'Server error'));

server.listen(PORT, () => logger.info(`🚀 API & Websockets running on port ${PORT}`));
