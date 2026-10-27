const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 21213;

const server = http.createServer((req, res) => {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('TikTok Live Bridge is Running Online!');
});

const wss = new WebSocket.Server({ server });

console.log(`Bridge Server sedang berjalan di port ${PORT}...`);

wss.on('connection', (ws) => {
console.log('Web Hatchable berjaya disambung!');
let tiktokLiveConnection = null;

ws.on('message', (message) => {
try {
const data = JSON.parse(message);
if (data.type === 'set_username') {
connectToTikTok(data.username);
}
} catch (e) {}
});

function connectToTikTok(targetUser) {
if (tiktokLiveConnection) return;

tiktokLiveConnection = new WebcastPushConnection(targetUser);

tiktokLiveConnection.connect().then(state => {
console.log(`Berjaya sambung ke TikTok Live: ${targetUser} (Room ID: ${state.roomId})`);
ws.send(JSON.stringify({ event: 'connected', roomId: state.roomId }));
}).catch(err => {
console.error('Gagal sambung ke TikTok:', err.message);
ws.send(JSON.stringify({ event: 'error', message: err.message }));
});

tiktokLiveConnection.on('chat', data => {
ws.send(JSON.stringify({
event: 'chat',
uniqueId: data.uniqueId,
nickname: data.nickname,
comment: data.comment,
profilePictureUrl: data.profilePictureUrl
}));
});

tiktokLiveConnection.on('gift', data => {
if (data.giftType === 1 && !data.repeatEnd) return;
ws.send(JSON.stringify({
event: 'gift',
uniqueId: data.uniqueId,
nickname: data.nickname,
giftName: data.giftName,
diamondCount: data.diamondCount,
profilePictureUrl: data.profilePictureUrl
}));
});

tiktokLiveConnection.on('follow', data => {
ws.send(JSON.stringify({
event: 'follow',
uniqueId: data.uniqueId,
nickname: data.nickname,
profilePictureUrl: data.profilePictureUrl
}));
});

tiktokLiveConnection.on('like', data => {
ws.send(JSON.stringify({
event: 'like',
uniqueId: data.uniqueId,
nickname: data.nickname,
likeCount: data.likeCount
}));
});
}

// Username TikTok akaun live
connectToTikTok('harukaai1');

ws.on('close', () => {
console.log('Sambungan ditutup');
if (tiktokLiveConnection) {
tiktokLiveConnection.disconnect();
}
});
});

server.listen(PORT, () => {
console.log(`HTTP/WebSocket Server aktif di port ${PORT}`);
});
