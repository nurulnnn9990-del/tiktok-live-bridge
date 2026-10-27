const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

// 1. HTTP Server untuk menerima Webhook dari TikFinity
const server = http.createServer((req, res) => {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
res.writeHead(204);
res.end();
return;
}

// Menerima data komentar/interaksi dari TikFinity
if (req.method === 'POST') {
let body = '';
req.on('data', chunk => {
body += chunk.toString();
});

req.on('end', () => {
try {
const rawData = JSON.parse(body || '{}');
console.log('TikFinity Data Masuk:', rawData);

// Ekstrak nama atau komentar penonton
const name = rawData.nickname || rawData.uniqueId || rawData.username || rawData.name || rawData.comment || 'Penonton';
const comment = rawData.comment || rawData.text || rawData.message || name;

// Bentuk pesan sesuai format yang dibaca oleh sistem Hatchable
const messagePayload = JSON.stringify({
type: 'chat',
event: 'chat',
nickname: name,
uniqueId: name,
comment: comment,
text: comment,
name: name
});

// Kirim langsung ke layar animasi Hatchable
let count = 0;
wss.clients.forEach(client => {
if (client.readyState === WebSocket.OPEN) {
client.send(messagePayload);
count++;
}
});

console.log(`Berhasil kirim [${name}] ke ${count} layar Hatchable.`);
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ status: 'ok', sentTo: count }));
} catch (err) {
console.error('Error Webhook:', err);
res.writeHead(400);
res.end('Bad Request');
}
});
return;
}

res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('TikTok Live Bridge Server is Online!');
});

// 2. WebSocket Server untuk layar Hatchable
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
console.log('>>> Web Hatchable berhasil tersambung! <<<');

ws.on('close', () => {
console.log('>>> Sambungan Hatchable ditutup. <<<');
});

ws.on('error', (err) => {
console.error('WebSocket Error:', err);
});
});

// 3. Jalankan server
server.listen(PORT, () => {
console.log(`Bridge Server aktif di port ${PORT}...`);
});
