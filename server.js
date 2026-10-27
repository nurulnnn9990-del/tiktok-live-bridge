const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 21213;

const server = http.createServer((req, res) => {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('TikTok Live Bridge is Running Online!');
});

const wss = new WebSocket.Server({ server });

console.log(`Bridge Server aktif di port ${PORT}...`);

wss.on('connection', (ws) => {
console.log('Web Hatchable berjaya disambung!');
let tiktokLiveConnection = null;

function connectToTikTok(targetUser) {
if (tiktokLiveConnection) return;

tiktokLiveConnection = new WebcastPushConnection(targetUser, {
enableExtendedGiftInfo: true
});

tiktokLiveConnection.connect().then(state => {
console.log(`Berjaya sambung ke TikTok Live: ${targetUser} (Room ID: ${state.roomId})`);
ws.send(JSON.stringify({ event: 'connected', roomId: state.roomId }));
}).catch(err => {
console.error('Gagal sambung ke TikTok:', err.message);
ws.send(JSON.stringify({ event: 'error', message: err.message }));
});

// 1. CHAT (Auto-Write Names)
tiktokLiveConnection.on('chat', data => {
const payload = {
uniqueId: data.uniqueId,
nickname: data.nickname,
comment: data.comment,
profilePictureUrl: data.profilePictureUrl
};
ws.send(JSON.stringify({
event: 'chat',
data: payload,
...payload
}));
});

// 2. GIFT (Rose, Doughnut, dsb)
tiktokLiveConnection.on('gift', data => {
if (data.giftType === 1 && !data.repeatEnd) return;

const payload = {
uniqueId: data.uniqueId,
nickname: data.nickname,
giftName: data.giftName,
giftId: data.giftId,
diamondCount: data.diamondCount,
repeatCount: data.repeatCount,
profilePictureUrl: data.profilePictureUrl
};
ws.send(JSON.stringify({
event: 'gift',
data: payload,
...payload
}));
});

// 3. FOLLOW (Trigger Balon / Paper Cranes + Avatar)
tiktokLiveConnection.on('follow', data => {
const payload = {
uniqueId: data.uniqueId,
nickname: data.nickname,
profilePictureUrl: data.profilePictureUrl
};
ws.send(JSON.stringify({
event: 'follow',
data: payload,
...payload
}));
});

// 4. SHARE (Trigger Paper Crane + Avatar)
tiktokLiveConnection.on('share', data => {
const payload = {
uniqueId: data.uniqueId,
nickname: data.nickname,
profilePictureUrl: data.profilePictureUrl
};
ws.send(JSON.stringify({
event: 'share',
data: payload,
...payload
}));
});

// 5. LIKE (Silent Write / Ting chime)
tiktokLiveConnection.on('like', data => {
const payload = {
uniqueId: data.uniqueId,
nickname: data.nickname,
likeCount: data.likeCount
};
ws.send(JSON.stringify({
event: 'like',
data: payload,
...payload
}));
});
}

// Sambung ke akaun TikTok awak
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
